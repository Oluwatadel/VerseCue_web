// Public product facts checked against the Windows desktop source on 29 October 2026.
// Keep proposed prices and unreleased features out of these public claims.
export const PRODUCT = {
  name: "VerseCue",
  title: "VerseCue — Live Scripture & Church Media for Windows",
  description: "A free Windows desktop workspace for Bible lookup, projection, songs, slides and video, with optional activated AI transcription and automatic verse detection.",
  platform: "Windows desktop",
  availability: "Windows installer coming soon",
  updated: "29 October 2026",
};

export const FEATURES = [
  { icon: "🎙", title: "Local speech recognition", description: "Optional activated AI transcription uses the included Parakeet model. Whisper alternatives download from a dropdown and can be deleted when inactive." },
  { icon: "🔎", title: "Scripture suggestions", description: "Follow live transcription, detect spoken Bible references, and find candidate passages from paraphrased Scripture. Review every match before displaying it." },
  { icon: "🖥", title: "Preview before projection", description: "Click a recent detection once to preview it. Double-click or use Display to send it to the verse display. The operator stays in control." },
  { icon: "📖", title: "Translations that stay in step", description: "Import supported XML or JSON Bible files. Save a default translation change to update manual selections, queued Bible selections and transcription detections." },
  { icon: "☑", title: "Queues and service plans", description: "Bookmark detected verses, build a Bible queue, and prepare named service plans. Displayed detections leave the recent list; queued bookmarks remain available." },
  { icon: "♫", title: "Songs and lyrics", description: "Prepare songs, select lyric sections, and build a dedicated song queue alongside your Scripture workflow." },
  { icon: "▣", title: "Slides and video", description: "Import supported PowerPoint presentations, show slides, and play local video with volume, repeat and playback controls." },
  { icon: "◉", title: "Live video sources", description: "Choose an available camera, capture device or screen source. A dashboard shortcut follows the selected source for full-screen video or video behind verses." },
  { icon: "✦", title: "Backgrounds and screensavers", description: "Start with two built-in verse backgrounds and three motion screensavers. Add pictures, GIFs or videos, with silent looping for moving backgrounds." },
  { icon: "◐", title: "Side-by-side appearance previews", description: "Compare a theme, verse background or screensaver beside Preferences. Preview text and dimming, or watch motion play, before you save." },
  { icon: "↔", title: "A workspace you can arrange", description: "Drag dashboard panels into the order your team prefers. Responsive layouts keep settings, songs, slides and service plans usable on smaller windows." },
  { icon: "✓", title: "Settings you choose to apply", description: "Changes stay pending until Save in the Preferences footer. Discard restores the active settings. Saved settings apply without restarting the app." },
];

export const STEPS = [
  { number: "01", title: "Prepare", description: "Connect the service audio, import Bibles you have permission to use, select your default translation and save your settings." },
  { number: "02", title: "Listen & detect", description: "Start the microphone. Local transcription feeds recent Bible-reference detections and candidate Scripture matches." },
  { number: "03", title: "Preview or queue", description: "Click a detection once to inspect it. Queue a bookmark, browse Scripture manually, or prepare the next song or slide." },
  { number: "04", title: "Display", description: "Double-click a detection or use Display when ready. The selected content reaches the projection window and the shown detection leaves the recent list." },
];

export const FAQS = [
  { question: "Is VerseCue a website or a desktop app?", answer: "VerseCue is a Windows desktop application. This website provides free downloads, optional AI activation, user guides and support. It does not run live transcription or control a church projector." },
  { question: "Does it display verses automatically?", answer: "The main workflow is operator controlled: a single click previews a recent detection; a double-click or Display action projects it. Speech and Scripture suggestions can be inaccurate, so review the reference, translation and verse text." },
  { question: "Can the desktop app work without internet?", answer: "Bible lookup, projection, songs, slides and local video work offline for free once your files are installed. Optional AI features require initial website activation and desktop sign-in. Signed offline AI access lasts up to 72 hours by default, after which AI must reconnect. Free features keep working if AI expires. Model downloads and online resources need internet." },
  { question: "Which speech models and languages are available?", answer: "Parakeet TDT 0.6B v2 is the bundled, English-focused default. Whisper Small English, Medium English and Large v3 Turbo are optional downloads. A multilingual speech model does not guarantee reliable Bible-reference detection in every language. Changing from Parakeet may reduce transcription or Scripture-detection accuracy; test your own sermon audio." },
  { question: "Which Bible translations can I use?", answer: "Import compatible Bible files in the supported XML or JSON formats. Availability depends on the files and permissions you hold. A Bible import does not grant redistribution rights, and VerseCue does not promise a bundled catalogue of copyrighted translations." },
  { question: "Does changing the translation affect manual Bible selections?", answer: "Yes. Choose a default translation and click Save. The saved choice is used for manual browsing/selections, queued Bible passages and transcription detections. Verify the next preview before displaying it." },
  { question: "Can I preview backgrounds and screensavers?", answer: "Yes. Appearance changes open a preview beside the settings. Verse backgrounds show your selected Scripture, or a sample verse, with the chosen dimming. Screensavers preview without verse text; pictures, GIFs and video loops are supported. These previews do not change the live output until you save." },
  { question: "Can I use my existing slides, songs and video sources?", answer: "The desktop workspace includes songs and lyric sections, supported PowerPoint imports, local video playback, and available live camera/capture/screen sources. File formats and device compatibility should be checked on your service computer before live use." },
  { question: "What computer do I need?", answer: "Current development and verification focus on Windows desktop. Speech recognition uses local computing resources, and performance depends on the selected model and your hardware. The Windows installer link and final system requirements will be added when the installer is ready. macOS and Linux are coming soon." },
  { question: "Where do I get help or report a problem?", answer: "Open the Support centre for troubleshooting and a support-report template. Include the app version, Windows version, selected speech model and steps to reproduce the problem. Published contact details will appear there when configured." },
];
