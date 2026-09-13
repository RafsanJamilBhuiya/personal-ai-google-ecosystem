const LEXICON = Object.freeze({
  "google.gmail.send": ["send email","send mail","gmail","email"],
  "google.calendar.list": ["calendar","upcoming event","events","meetings","schedule"],
  "google.calendar.create": ["create event","schedule meeting","add appointment","new calendar event"],
  "google.sheets.read": ["read sheet","show sheet","spreadsheet","rows","cells","range"],
  "google.sheets.append": ["add row","append row","insert row","add data"],
  "google.sheets.update": ["update sheet","edit cell","change cell","update row"],
  "google.drive.list": ["drive files","list files","find files","folders"],
  "google.drive.create": ["create file","create folder","new file","new folder"],
  "google.docs.get": ["read document","show document","get document"],
  "google.docs.create": ["create document","new document"],
  "google.forms.get": ["show form","read form","form responses"],
  "google.forms.create": ["create form","new form"],
  "google.blogger.posts": ["blog posts","blogger posts","show posts"],
  "google.blogger.createPost": ["publish blog","create blog post","write blog post"]
});

const tokens = text => String(text).toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean);
export function semanticCandidates(command, context = {}) {
  const text = `${command} ${context.previousIntent || ""}`.toLowerCase();
  const words = new Set(tokens(text));
  return Object.entries(LEXICON).map(([intent, phrases]) => {
    let score = 0;
    for (const phrase of phrases) {
      const phraseWords = tokens(phrase);
      if (text.includes(phrase)) score += 0.35;
      score += phraseWords.filter(w => words.has(w)).length * 0.08;
    }
    return { intent, confidence: Math.min(0.99, score) };
  }).filter(x => x.confidence > 0).sort((a,b) => b.confidence-a.confidence);
}

export function detectIntent(command, context = {}) {
  const candidates = semanticCandidates(command, context);
  if (!candidates.length || candidates[0].confidence < 0.35) return { intent: "task.create", confidence: 0.5, candidates };
  return { intent: candidates[0].intent, confidence: candidates[0].confidence, candidates };
}
