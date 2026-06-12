// Uygulama içinden widget'ı tazeleme (etkinlik değişince / açılışta).
// iOS'ta no-op; native modül yalnızca çağrı anında lazy require edilir
// (böylece iOS bundle'ında native modüle hiç dokunulmaz).

import { Platform } from 'react-native';

export async function updateTodayWidget() {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const React = require('react');
    const { TodayWidget } = require('./TodayWidget');
    const { getTodayEventsForWidget } = require('./todayEvents');

    const events = await getTodayEventsForWidget();
    await requestWidgetUpdate({
      widgetName: 'Today',
      renderWidget: () => React.createElement(TodayWidget, { events }),
      widgetNotFound: () => {},
    });
  } catch (e) {
    // widget eklenmemişse / hata olursa sessiz geç
  }
}
