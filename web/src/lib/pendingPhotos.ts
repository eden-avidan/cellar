// Hands photos picked in the add menu over to the add page. The native picker has to be opened
// straight from the tap (iOS rule), so it runs in the menu, before navigating to /add.
let pending: File[] = [];

export function setPendingPhotos(files: File[]) {
  pending = files;
}

export function takePendingPhotos(): File[] {
  const files = pending;
  pending = [];
  return files;
}
