export const THEME_STORAGE_KEY = 'ps_theme';

/**
 * Se ejecuta en <head> antes de pintar: aplica el tema guardado o, si no hay,
 * el del sistema, para evitar el "parpadeo" de tema incorrecto al cargar.
 * Vive fuera de los componentes cliente para poder usarse en el layout (servidor).
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var d=document.documentElement;d.classList.toggle('dark',t==='dark');d.style.colorScheme=t}catch(e){}})()`;
