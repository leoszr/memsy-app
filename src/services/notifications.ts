import { decideDailyReminder } from '../logic/progress';
import { Card, DailyStat, Settings } from '../logic/types';

const REMINDER_ID_KEY = 'notificationReminderId';

export async function syncDailyReminder(
  settings: Settings,
  todayStats: DailyStat | null,
  cards: Card[],
  updateSettings: (settings: Settings) => Promise<void>,
): Promise<void> {
  const decision = decideDailyReminder(settings, todayStats, cards);
  const Notifications = await import('expo-notifications');

  if (settings[REMINDER_ID_KEY]) {
    await Notifications.cancelScheduledNotificationAsync(
      settings[REMINDER_ID_KEY],
    );
    await updateSettings({ [REMINDER_ID_KEY]: '' });
  }

  if (decision.action === 'cancel') return;

  const permissions = await Notifications.getPermissionsAsync();
  const finalPermissions = permissions.granted
    ? permissions
    : await Notifications.requestPermissionsAsync();
  if (!finalPermissions.granted) {
    await updateSettings({ notificationsEnabled: 'false' });
    return;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Memsy te espera 🔥',
      body: `Você tem ${decision.cardsToReview} palavras para revisar hoje.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: decision.hour,
      minute: decision.minute,
    },
  });
  await updateSettings({
    notificationsEnabled: 'true',
    notificationHour: String(decision.hour),
    [REMINDER_ID_KEY]: id,
  });
}
