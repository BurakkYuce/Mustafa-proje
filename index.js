import { registerRootComponent } from 'expo';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App';
import { widgetTaskHandler } from './src/widget/widgetTaskHandler';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Android ana ekran widget'ı: OS widget'ı ekle/güncelle/yeniden boyutlandır
// olaylarında (uygulama kapalıyken bile) bu handler çağrılır.
registerWidgetTaskHandler(widgetTaskHandler);
