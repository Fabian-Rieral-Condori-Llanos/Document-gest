import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import AppRoutes from './routes/AppRoutes';
import './api/interceptors'; // Importante: cargar interceptors

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#252836',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#252836',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#252836',
              },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;