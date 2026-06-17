/** Close any native dialogs and reset the browser top layer (stuck backdrops). */
export function clearDialogTopLayer() {
  document.querySelectorAll("dialog").forEach((node) => {
    if (node instanceof HTMLDialogElement && node.open) {
      node.close();
    }
  });

  const probe = document.createElement("dialog");
  document.body.appendChild(probe);
  try {
    probe.showModal();
    probe.close();
  } catch {
    // Some environments disallow showModal during certain lifecycle phases.
  } finally {
    probe.remove();
  }
}
