document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL        = 'http://127.0.0.1:8000'; // ➜ Cambia esto al dominio de tu servidor
  const formContainer   = document.getElementById('form-container');
  const loaderContainer = document.getElementById('loader-container');
  const resultContainer = document.getElementById('result-container');
  const resultMessage   = document.getElementById('result-message');
  const resetButton     = document.getElementById('reset-button');
  const ktasForm        = document.getElementById('ktas-form');

  ktasForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1) Fade-out y ocultar el formulario
    formContainer.classList.add('fade-out');
    setTimeout(() => formContainer.classList.add('hidden'), 500);

    // 2) Mostrar spinner
    loaderContainer.classList.remove('hidden');

    // 3) Construir payload con operador ternario para Sex
    const sexInput    = document.getElementById('sex').value.trim();
    const sexNumeric  = sexInput === 'Male' ? 1 : 2;
    const payload = {
      Sex:        sexNumeric,
      Age:        Number(document.getElementById('age').value),
      Mental:     Number(document.getElementById('mental').value),
      NRS_pain:   Number(document.getElementById('nrsPain').value),
      SBP:        Number(document.getElementById('sbp').value),
      DBP:        Number(document.getElementById('dbp').value),
      HR:         Number(document.getElementById('hr').value),
      RR:         Number(document.getElementById('rr').value),
      BT:         Number(document.getElementById('bt').value),
      Saturation: Number(document.getElementById('saturation').value),
    };

    // (Opcional) Simulación de retardo para ver la animación
    await new Promise(res => setTimeout(res, 500));

    try {
      // 4) (Opcional) Health-check
      // const health = await fetch(`${BASE_URL}/`);
      // if (!health.ok) throw new Error('Service unavailable');

      // 5) Llamada al endpoint /predict
      const response = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // 6) Extraer prediction en lugar de ktas
      const data = await response.json();
      const ktasValue = data.prediction;

      // 7) Asignar color y texto
      let bgColor = '#ffffff';
      let text    = '';
      switch (ktasValue) {
        case 1:
          bgColor = '#E74C3C';
          text    = 'KTAS 1 – Resucitación: Emergencia inmediata, riesgo vital';
          break;
        case 2:
          bgColor = '#E67E22';
          text    = 'KTAS 2 – Emergencia: Muy urgente, requiere atención rápida';
          break;
        case 3:
          bgColor = '#F1C40F';
          text    = 'KTAS 3 – Urgente: Atención en tiempo razonable';
          break;
        case 4:
          bgColor = '#2ECC71';
          text    = 'KTAS 4 – Poco urgente: Puede esperar';
          break;
        case 5:
          bgColor = '#3498DB';
          text    = 'KTAS 5 – No urgente: Sin urgencia, puede esperar mucho tiempo';
          break;
        default:
          text = 'Error inesperado en la clasificación.';
      }

      // 8) Mostrar resultado
      document.body.style.backgroundColor = bgColor;
      loaderContainer.classList.add('hidden');
      resultMessage.textContent = text;
      resultContainer.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      loaderContainer.classList.add('hidden');
      resultMessage.textContent = 'Ocurrió un error al comunicarse con la API.';
      resultContainer.classList.remove('hidden');
    }
  });

  // Reiniciar sin recargar
  resetButton.addEventListener('click', () => {
    document.body.style.backgroundColor = '#ffffff';
    ktasForm.reset();
    formContainer.classList.remove('hidden', 'fade-out');
    resultContainer.classList.add('hidden');
  });
});
