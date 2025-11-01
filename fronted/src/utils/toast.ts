import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

export const toastSuccess = (message: string, title = 'Éxito') => {
  iziToast.success({
    title,
    message,
    backgroundColor: '#0ba122ff',
    titleColor: '#fff',
    messageColor: '#fff',
    iconColor: '#fff',
    position: 'bottomRight',
    timeout: 2500,
    progressBar: true,
    transitionIn: 'fadeInDown',
    transitionOut: 'fadeOutUp',
  });
};

export const toastInfo = (message: string, title = 'Información') => {
  iziToast.info({
    title,
    message,
    backgroundColor: '#2563eb',
    titleColor: '#fff',
    messageColor: '#fff',
    iconColor: '#fff',
    position: 'bottomRight',
    timeout: 2500,
    progressBar: true,
    transitionIn: 'fadeInDown',
    transitionOut: 'fadeOutUp',
  });
};

export const toastWarning = (message: string, title = 'Advertencia') => {
  iziToast.warning({
    title,
    message,
    backgroundColor: '#eab308',
    titleColor: '#000',
    messageColor: '#000',
    iconColor: '#000',
    position: 'bottomRight',
    timeout: 2500,
    progressBar: true,
    transitionIn: 'fadeInDown',
    transitionOut: 'fadeOutUp',
  });
};

export const toastError = (message: string, title = 'Error') => {
  iziToast.error({
    title,
    message,
    backgroundColor: '#dc2626',
    titleColor: '#fff',
    messageColor: '#fff',
    iconColor: '#fff',
    position: 'bottomRight',
    timeout: 2500,
    progressBar: true,
    transitionIn: 'fadeInDown',
    transitionOut: 'fadeOutUp',
  });
};

