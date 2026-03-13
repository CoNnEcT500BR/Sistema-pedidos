import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router';
import { I18nProvider } from '@/i18n';

function App() {
  return (
    <I18nProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </I18nProvider>
  );
}

export default App;
