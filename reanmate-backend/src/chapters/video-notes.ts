import type { GeminiService } from '../chat/gemini.service.js';

const VIDEO_NOTES_INSTRUCTION = [
  'អ្នកជាអ្នកកត់ត្រាមេរៀនសម្រាប់សិស្សវិទ្យាល័យនៅកម្ពុជា។',
  'មើលវីដេអូមេរៀននេះ ហើយសរសេរកំណត់ត្រាលម្អិតជាភាសាខ្មែរ៖ ប្រធានបទ និយមន័យ រូបមន្ត ឧទាហរណ៍ដែលគ្រូដោះស្រាយ (ជាជំហានៗ) និងគន្លឹះសំខាន់ៗ តាមលំដាប់ដែលបង្ហាញក្នុងវីដេអូ។',
  'សរសេរតែអ្វីដែលមានក្នុងវីដេអូប៉ុណ្ណោះ — កុំបន្ថែមព័ត៌មានថ្មី។',
].join('\n');

/**
 * Gemini's view of a chapter's video, as text. Attaching the video itself to
 * every chat message cost ~45 s and ~570k input tokens per reply, so this runs
 * once per video and the result is stored on the chapter.
 */
export function writeVideoNotes(gemini: GeminiService, videoUri: string): Promise<string> {
  return gemini.generateFromVideo(VIDEO_NOTES_INSTRUCTION, videoUri, 'សរសេរកំណត់ត្រាមេរៀនពីវីដេអូនេះ។');
}

/**
 * The YouTube watch URL Gemini accepts for a chapter's embed URL. Other links
 * (e.g. ebc.edu.kh lesson pages) are web pages Vertex AI refuses to fetch
 * (URL_ROBOTED), so those chapters chat from their text only.
 */
export function getGeminiVideoUri(embedUrl: string): string | undefined {
  if (!embedUrl) return undefined;

  try {
    const url = new URL(embedUrl);
    if (url.protocol !== 'https:') return undefined;

    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
      const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }

    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1).split('/')[0];
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
