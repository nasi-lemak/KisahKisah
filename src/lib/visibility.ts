/** Who can see a catalogue (pure; mirrors Spotify's public / link-only / private). */
export function canViewList(v: { visibility: string; isOwner: boolean; isCollaborator: boolean; viaShareLink: boolean }): boolean {
  if (v.isOwner || v.isCollaborator) return true;
  if (v.visibility === "public") return true;
  if (v.visibility === "unlisted") return v.viaShareLink;
  return false;
}
