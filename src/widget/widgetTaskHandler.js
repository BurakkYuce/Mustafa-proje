// Android widget olay yöneticisi. OS widget'ı eklediğinde/güncellediğinde
// (uygulama kapalıyken bile) çağrılır; bugünün etkinliklerini çizer.

import React from 'react';
import { TodayWidget } from './TodayWidget';
import { getTodayEventsForWidget } from './todayEvents';

export async function widgetTaskHandler(props) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const events = await getTodayEventsForWidget();
      props.renderWidget(<TodayWidget events={events} />);
      break;
    }
    // WIDGET_CLICK: kök FlexWidget'taki clickAction="OPEN_APP" uygulamayı açar.
    default:
      break;
  }
}
