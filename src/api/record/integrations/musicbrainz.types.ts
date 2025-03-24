export interface MusicBrainzTrack {
  $: { id: string };
  position: string[];
  number: string[];
  length?: string[];
  recording: {
    $: { id: string };
    title: string[];
    length?: string[];
    disambiguation?: string[];
    'first-release-date'?: string[];
  }[];
}
