import { App, Notice } from "obsidian";

import { SRSettings } from "src/data/settings";

export class TTSUtil {
    private static currentAudio: HTMLAudioElement | null = null;
    // Resolver for the promise returned by speak(); called when playback stops for any reason
    // (natural end, error, or an explicit stop() call) so callers never hang.
    private static currentResolve: (() => void) | null = null;

    public static cleanTextForTTS(text: string): string {
        return text
            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2") // [[Link|Alias]] -> Alias
            .replace(/\[\[([^\]]+)\]\]/g, "$1") // [[Link]] -> Link
            .replace(/==([^=]+)==/g, "$1") // ==highlight== -> highlight
            .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** -> bold
            .replace(/\*([^*]+)\*/g, "$1") // *italic* -> italic
            .replace(/<[^>]*>/g, "") // HTML tags -> empty
            .trim();
    }

    /**
     * Best-effort language detection so browser speech synthesis picks a sensible voice.
     * Falls back to Portuguese (pt-BR) to match the author's default setup.
     */
    public static detectLang(text: string): string {
        // Japanese (Hiragana / Katakana)
        if (/[\u3040-\u30ff]/.test(text)) {
            return "ja-JP";
        }
        // Korean (Hangul)
        if (/[\uac00-\ud7af]/.test(text)) {
            return "ko-KR";
        }
        // Mandarin Chinese (Han characters)
        if (/[\u4e00-\u9fa5]/.test(text)) {
            return "zh-CN";
        }
        // Cyrillic (Russian, etc.)
        if (/[\u0400-\u04ff]/.test(text)) {
            return "ru-RU";
        }
        // Arabic
        if (/[\u0600-\u06ff]/.test(text)) {
            return "ar-SA";
        }
        // Hebrew
        if (/[\u0590-\u05ff]/.test(text)) {
            return "he-IL";
        }
        // Default fallback (Portuguese)
        return "pt-BR";
    }

    public static getCacheFileName(text: string, voice: string): string {
        const cleaned = this.cleanTextForTTS(text);
        let hash = 0;
        const str = `${voice}:${cleaned}`;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return `tts_cache_${Math.abs(hash)}.mp3`;
    }

    public static async isCached(app: App, text: string, settings: SRSettings): Promise<boolean> {
        if (settings.ttsProvider !== "openai-compatible") return false;
        const voice = settings.ttsVoice || "default";
        const fileName = this.getCacheFileName(text, voice);
        const filePath = `.obsidian/plugins/obsidian-spaced-repetition/cache/${fileName}`;
        const exists = await app.vault.adapter.exists(filePath);
        return exists;
    }

    /**
     * Stops any audio currently playing (server-backed audio or browser speech) and resolves
     * the pending speak() promise so awaiting callers continue immediately.
     */
    public static stop(): void {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.onended = null;
            this.currentAudio.onerror = null;
            this.currentAudio = null;
        }

        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        if (this.currentResolve) {
            const resolve = this.currentResolve;
            this.currentResolve = null;
            resolve();
        }
    }

    static async speak(app: App, text: string, settings: SRSettings, lang?: string): Promise<void> {
        const cleanedText = this.cleanTextForTTS(text);

        // Stop any currently playing audio
        this.stop();

        if (settings.ttsProvider === "openai-compatible") {
            try {
                const voice = settings.ttsVoice || "default";
                const fileName = this.getCacheFileName(text, voice);
                const cacheDir = ".obsidian/plugins/obsidian-spaced-repetition/cache";
                const filePath = `${cacheDir}/${fileName}`;

                // Ensure cache directory exists
                if (!(await app.vault.adapter.exists(cacheDir))) {
                    await app.vault.adapter.mkdir(cacheDir);
                }

                let audioBuffer: ArrayBuffer;

                // Check cache first
                if (await app.vault.adapter.exists(filePath)) {
                    console.log("Playing TTS from local cache:", filePath);
                    audioBuffer = await app.vault.adapter.readBinary(filePath);
                } else {
                    console.log("Cache miss. Fetching TTS from server for text:", cleanedText);
                    const baseUrl = settings.ttsBaseUrl
                        ? settings.ttsBaseUrl.replace(/\/$/, "")
                        : "http://localhost:8880/v1";
                    const url = `${baseUrl}/audio/speech`;

                    const headers: Record<string, string> = {
                        "Content-Type": "application/json",
                    };

                    if (settings.ttsApiKey) {
                        headers["Authorization"] = `Bearer ${settings.ttsApiKey}`;
                    }

                    const response = await fetch(url, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            model: settings.ttsModel || "kokoro",
                            input: cleanedText,
                            voice: voice,
                        }),
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        console.error("TTS API error response:", response.status, errText);
                        new Notice(`TTS API Error (${response.status}): ${errText}`);
                        return;
                    }

                    audioBuffer = await response.arrayBuffer();

                    // Save to cache
                    await app.vault.adapter.writeBinary(filePath, audioBuffer);
                    console.log("Saved TTS audio to cache:", filePath);
                }

                const blob = new Blob([audioBuffer], { type: "audio/mp3" });
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                this.currentAudio = audio;

                // Resolve only once the audio finishes (or fails), so callers can sequence UI
                // changes (like revealing hidden card text) after playback completes.
                await new Promise<void>((resolve) => {
                    let settled = false;
                    const finish = () => {
                        if (settled) return;
                        settled = true;
                        audio.onended = null;
                        audio.onerror = null;
                        URL.revokeObjectURL(audioUrl);
                        if (this.currentAudio === audio) {
                            this.currentAudio = null;
                        }
                        if (this.currentResolve === finish) {
                            this.currentResolve = null;
                        }
                        resolve();
                    };
                    this.currentResolve = finish;
                    audio.onended = finish;
                    audio.onerror = finish;
                    void audio.play().catch((e) => {
                        console.error("Failed to play TTS audio:", e);
                        finish();
                    });
                });
                return;
            } catch (e) {
                console.error("Failed to fetch/play OpenAI-compatible TTS:", e);
                new Notice(`TTS Request Failed: ${e.toString()}`);
                return;
            }
        }

        // Fallback to browser SpeechSynthesis
        if (!("speechSynthesis" in window)) {
            console.error("Speech Synthesis not supported in this browser.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanedText);

        if (lang) {
            utterance.lang = lang;
        }

        const voices = window.speechSynthesis.getVoices();

        if (settings.ttsVoice) {
            const voice = voices.find((v) => v.name === settings.ttsVoice);
            if (voice) {
                utterance.voice = voice;
            }
        } else if (lang) {
            const voice = voices.find(
                (v) => v.lang.startsWith(lang) || v.lang.replace("_", "-").startsWith(lang),
            );
            if (voice) {
                utterance.voice = voice;
            }
        }

        await new Promise<void>((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                utterance.onend = null;
                utterance.onerror = null;
                if (this.currentResolve === finish) {
                    this.currentResolve = null;
                }
                resolve();
            };
            this.currentResolve = finish;
            utterance.onend = finish;
            utterance.onerror = finish;

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    }
}
