export function startSpinner() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) {
      spinner.classList.remove('d-none');
    }
  }
  

  export function stopSpinner() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) {
      spinner.classList.add('d-none');
    }
  }