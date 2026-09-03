export function clearSensitiveForm(form: HTMLFormElement | null): void {
  if (!form) {
    return;
  }

  form.reset();
  for (const input of form.querySelectorAll("input")) {
    if (input.type === "checkbox" || input.type === "radio") {
      input.checked = false;
    } else {
      input.value = "";
    }
  }
}
