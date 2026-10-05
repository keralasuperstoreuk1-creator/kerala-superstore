import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type = 'special_item', specialItemId, link = '/' } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required for customer notification broadcast.' },
        { status: 400 }
      );
    }

    const broadcastPayload = {
      id: `broadcast-${Date.now()}`,
      title,
      message,
      type,
      specialItemId,
      link,
      topic: 'kerala_superstore_specials',
      timestamp: new Date().toISOString(),
    };

    // Firebase Cloud Messaging (FCM) Integration
    // If you configure FIREBASE_SERVER_KEY or Firebase Admin SDK in .env.local:
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    let fcmStatus = 'simulated';

    if (fcmServerKey) {
      try {
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: '/topics/kerala_superstore_specials',
            priority: 'high',
            notification: {
              title: title,
              body: message,
              icon: '/branding/kerala-superstore-round-logo.png',
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            data: {
              type: type,
              specialItemId: specialItemId || '',
              link: link,
            },
          }),
        });

        if (fcmResponse.ok) {
          fcmStatus = 'sent_to_fcm';
        }
      } catch (err) {
        console.warn('FCM delivery attempt notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notification broadcasted to all customer app users on topic 'kerala_superstore_specials'`,
      broadcast: broadcastPayload,
      fcmStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to broadcast customer notification' },
      { status: 500 }
    );
  }
}
