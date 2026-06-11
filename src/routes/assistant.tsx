import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatAI } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({ component: Assistant });

type Msg = { role: "user" | "assistant"; content: string };

function Assistant() {
  const { t, lang } = useI18n();
  const ask = useServerFn(chatAI);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: lang === "te"
      ? "నమస్తే! నేను జన్ సహాయక్ AI. ప్రభుత్వ పథకాలు, పత్రాలు, లేదా అర్హత గురించి అడగండి."
      : "Namaste! I'm JanSahayak AI. Ask me about government schemes, documents, eligibility, or procedures." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const mut = useMutation({
    mutationFn: async (history: Msg[]) => ask({ data: { messages: history, lang } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply }]),
    onError: (e: any) => toast.error(e.message),
  });

  const send = () => {
    if (!input.trim() || mut.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    mut.mutate(next);
  };

  const voice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    const r = new SR();
    r.lang = lang === "te" ? "te-IN" : "en-IN";
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onerror = () => toast.error("Voice failed");
    r.start();
    recRef.current = r;
  };

  const suggestions = lang === "te"
    ? ["రైతుల కోసం పథకాలు", "ఆధార్ ఎలా అప్‌డేట్ చేయాలి?", "మహిళలకు రుణ పథకాలు", "విద్యార్థి స్కాలర్‌షిప్‌లు"]
    : ["Schemes for farmers", "How to update Aadhaar?", "Loan schemes for women", "Student scholarships"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-xl gradient-hero grid place-items-center text-primary-foreground shadow-glow">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("nav_assistant")}</h1>
          <p className="text-sm text-muted-foreground">JanSahayak AI</p>
        </div>
      </div>

      <div className="mt-6 gradient-card rounded-2xl border border-border min-h-[480px] flex flex-col">
        <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                m.role === "user"
                  ? "gradient-hero text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}>{m.content}</div>
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
          <Button onClick={send} disabled={mut.isPending || !input.trim()} className="gradient-hero text-primary-foreground border-0 gap-1.5">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
