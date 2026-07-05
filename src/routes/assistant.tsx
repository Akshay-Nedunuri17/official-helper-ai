import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles, Loader2, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chatAI } from "@/lib/ai.functions";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/assistant")({ component: Assistant });

type Msg = { role: "user" | "assistant"; content: string };

type Profile = {
  age?: number;
  gender?: string;
  occupation?: string;
  income?: string;
  state?: string;
  category?: string;
};

const STATES = ["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Kerala","Maharashtra","Gujarat","Rajasthan","Uttar Pradesh","Bihar","West Bengal","Madhya Pradesh","Odisha","Punjab","Haryana","Delhi","Other"];
const INCOMES = ["Below ₹1L/yr","₹1L–₹2.5L/yr","₹2.5L–₹5L/yr","₹5L–₹10L/yr","Above ₹10L/yr"];
const OCCUPATIONS = ["Farmer","Student","Homemaker","Daily wage worker","Salaried","Self-employed","Unemployed","Senior citizen","Artisan/Craftsperson","Other"];
const CATEGORIES = ["General","OBC","SC","ST","Minority","EWS"];

function Assistant() {
  const { t, lang } = useI18n();
  const ask = useServerFn(chatAI);
  const [profile, setProfile] = useState<Profile>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("js_profile") || "{}"); } catch { return {}; }
  });
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: lang === "te"
      ? "నమస్తే! 👋 నేను **జన్ సహాయక్ AI**. మీ వయసు, ఆదాయం, వృత్తి, రాష్ట్రం ఆధారంగా సరైన ప్రభుత్వ పథకాలను సిఫార్సు చేస్తాను. ప్రారంభించడానికి **My profile** నొక్కండి."
      : "Namaste! 👋 I'm **JanSahayak AI**. I can recommend the most relevant Indian government schemes based on your age, income, occupation, and state. Tap **My profile** to personalize, or just ask anything below." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    if (typeof window !== "undefined") localStorage.setItem("js_profile", JSON.stringify(p));
  };

  const langName = LANGUAGES.find((l) => l.code === lang)?.name ?? "English";
  const mut = useMutation({
    mutationFn: async (history: Msg[]) => ask({ data: { messages: history, lang, langName, profile } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply }]),
    onError: (e: any) => toast.error(e.message),
  });


  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || mut.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    mut.mutate(next);
  };

  const recommendForMe = () => {
    const filled = Object.values(profile).some(Boolean);
    if (!filled) { setShowProfile(true); toast.info(lang === "te" ? "ముందుగా ప్రొఫైల్ నింపండి" : "Please fill your profile first"); return; }
    const q = lang === "te"
      ? "నా ప్రొఫైల్ ఆధారంగా టాప్ 5 అత్యంత సంబంధిత ప్రభుత్వ పథకాలను సిఫార్సు చేయండి."
      : "Based on my profile, recommend the top 5 most relevant government schemes for me with eligibility, benefits, documents, and apply links.";
    send(q);
  };

  const voice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    const bcp47: Record<string, string> = {
      en: "en-IN", hi: "hi-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN", ta: "ta-IN",
      ur: "ur-IN", gu: "gu-IN", kn: "kn-IN", or: "or-IN", ml: "ml-IN", pa: "pa-IN",
      as: "as-IN", ne: "ne-IN", sa: "sa-IN",
    };
    const r = new SR();
    r.lang = bcp47[lang] ?? "en-IN";
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onerror = () => toast.error("Voice failed");
    r.start();
    recRef.current = r;
  };


  const suggestions = lang === "te"
    ? ["రైతుల కోసం పథకాలు", "ఆధార్ ఎలా అప్‌డేట్ చేయాలి?", "మహిళలకు రుణ పథకాలు", "విద్యార్థి స్కాలర్‌షిప్‌లు"]
    : ["Schemes for farmers", "How to update Aadhaar?", "Loan schemes for women", "Student scholarships"];

  const profileFilled = Object.values(profile).filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-11 shrink-0 rounded-xl gradient-hero grid place-items-center text-primary-foreground shadow-glow">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{t("nav_assistant")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">JanSahayak AI</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowProfile(true)} className="gap-1.5 shrink-0">
          <UserCog className="size-4" />
          <span className="hidden sm:inline">{lang === "te" ? "నా ప్రొఫైల్" : "My profile"}</span>
          {profileFilled > 0 && <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{profileFilled}</span>}
        </Button>
      </div>

      <div className="mt-5 gradient-card rounded-2xl border border-border min-h-[480px] flex flex-col">
        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "gradient-hero text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-a:text-primary">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-line">{m.content}</span>
                )}
              </div>
            </div>
          ))}
          {mut.isPending && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl px-4 py-3 text-sm inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            <button onClick={recommendForMe} className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90">
              ✨ {lang === "te" ? "నాకు సిఫార్సు చేయండి" : "Recommend for me"}
            </button>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-accent transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-border flex gap-2">
          <Button variant="outline" size="icon" onClick={voice} aria-label="voice"><Mic className="size-4" /></Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("chat_placeholder")}
            className="flex-1"
            disabled={mut.isPending}
          />
          <Button onClick={() => send()} disabled={mut.isPending || !input.trim()} className="gradient-hero text-primary-foreground border-0 gap-1.5">
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{lang === "te" ? "నా ప్రొఫైల్" : "My profile"}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "te" ? "మెరుగైన సిఫార్సుల కోసం. స్థానికంగా నిల్వ చేయబడుతుంది." : "Used to personalize recommendations. Stored locally on this device."}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowProfile(false)}><X className="size-4" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{lang === "te" ? "వయసు" : "Age"}</Label>
                <Input type="number" min={0} max={120} value={profile.age ?? ""} onChange={(e) => saveProfile({ ...profile, age: e.target.value ? +e.target.value : undefined })} />
              </div>
              <div>
                <Label>{lang === "te" ? "లింగం" : "Gender"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile.gender ?? ""} onChange={(e) => saveProfile({ ...profile, gender: e.target.value || undefined })}>
                  <option value="">—</option>
                  <option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label>{lang === "te" ? "వృత్తి" : "Occupation"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile.occupation ?? ""} onChange={(e) => saveProfile({ ...profile, occupation: e.target.value || undefined })}>
                  <option value="">—</option>
                  {OCCUPATIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Label>{lang === "te" ? "వార్షిక ఆదాయం" : "Annual income"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile.income ?? ""} onChange={(e) => saveProfile({ ...profile, income: e.target.value || undefined })}>
                  <option value="">—</option>
                  {INCOMES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>{lang === "te" ? "రాష్ట్రం" : "State"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile.state ?? ""} onChange={(e) => saveProfile({ ...profile, state: e.target.value || undefined })}>
                  <option value="">—</option>
                  {STATES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>{lang === "te" ? "వర్గం" : "Category"}</Label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile.category ?? ""} onChange={(e) => saveProfile({ ...profile, category: e.target.value || undefined })}>
                  <option value="">—</option>
                  {CATEGORIES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={() => { setShowProfile(false); recommendForMe(); }} className="flex-1 gradient-hero text-primary-foreground border-0">
                ✨ {lang === "te" ? "ఇప్పుడు సిఫార్సు" : "Recommend now"}
              </Button>
              <Button variant="outline" onClick={() => { saveProfile({}); toast.success("Cleared"); }}>
                {lang === "te" ? "క్లియర్" : "Clear"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
