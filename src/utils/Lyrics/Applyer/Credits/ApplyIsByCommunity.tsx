// Self-hosted fork: show attribution without external profile links or avatars.
export function CleanUpIsByCommunity(): void {}

export function ApplyIsByCommunity(data: any, LyricsContainer: HTMLElement): void {
  if (data.source !== "spl" || !LyricsContainer) return;
  const info = document.createElement("div");
  info.classList.add("SongInfo");
  const notice = document.createElement("span");
  notice.style.opacity = "0.5";
  notice.textContent = "These lyrics have been provided by our community";
  info.appendChild(notice);

  for (const [role, label] of [["Maker", "Made by"], ["Uploader", "Uploaded by"]]) {
    const username = data.TTMLUploadMetadata?.[role]?.username;
    if (!username) continue;
    const credit = document.createElement("span");
    credit.classList.add(role);
    credit.textContent = `${label} @${username}`;
    info.appendChild(credit);
  }
  LyricsContainer.appendChild(info);
}
