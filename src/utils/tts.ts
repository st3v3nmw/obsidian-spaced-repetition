import { SRSettings } from "src/data/settings";
import { Notice, App } from "obsidian";

export class TTSUtil {
    private static currentAudio: HTMLAudioElement | null = null;

    public static cleanTextForTTS(text: string): string {
        return text
            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2") // [[Link|Alias]] -> Alias
            .replace(/\[\[([^\]]+)\]\]/g, "$1")         // [[Link]] -> Link
            .replace(/==([^=]+)==/g, "$1")               // ==highlight== -> highlight
            .replace(/\*\*([^*]+)\*\*/g, "$1")           // **bold** -> bold
            .replace(/\*([^*]+)\*/g, "$1")               // *italic* -> italic
            .replace(/<[^>]*>/g, "")                     // HTML tags -> empty
            .trim();
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

    static async speak(app: App, text: string, settings: SRSettings, lang?: string): Promise<void> {
        const cleanedText = this.cleanTextForTTS(text);

        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        if (settings.ttsProvider === "openai-compatible") {
            try {
                const voice = settings.ttsVoice || "default";
                const fileName = this.getCacheFileName(text, voice);
                const cacheDir = `.obsidian/plugins/obsidian-spaced-repetition/cache`;
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
                    const baseUrl = settings.ttsBaseUrl ? settings.ttsBaseUrl.replace(/\/$/, "") : "http://localhost:8880/v1";
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
                this.currentAudio = new Audio(audioUrl);
                
                await this.currentAudio.play();
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
            const voice = voices.find((v) => v.lang.startsWith(lang) || v.lang.replace('_', '-').startsWith(lang));
            if (voice) {
                utterance.voice = voice;
            }
        }

        window.speechSynthesis.speak(utterance);
    }
}
