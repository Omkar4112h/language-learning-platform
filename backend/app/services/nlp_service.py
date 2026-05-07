"""
NLP Language Processing Service

Uses spaCy and transformers for:
- Grammar correction
- Translation
- Conversation generation
- Vocabulary extraction
"""

from typing import List, Dict, Optional, Tuple
import os
import re
import random
import requests

try:
    from spellchecker import SpellChecker  # pyspellchecker
    SPELLCHECK_AVAILABLE = True
except Exception:
    SpellChecker = None
    SPELLCHECK_AVAILABLE = False

try:
    import spacy
    SPACY_AVAILABLE = True
except Exception:
    spacy = None
    SPACY_AVAILABLE = False

# Language model cache
nlp_models = {}


class _FallbackToken:
    def __init__(self, text: str):
        self.text = text
        self.dep_ = ""
        self.pos_ = ""
        self.tag_ = ""
        self.head = self


class _FallbackDoc(list):
    def __init__(self, text: str):
        tokens = [_FallbackToken(token) for token in text.split()]
        super().__init__(tokens)
        self.text = text


class _FallbackNLP:
    def __call__(self, text: str):
        return _FallbackDoc(text)

def get_nlp_model(language: str):
    """Load spaCy model for language"""
    if not SPACY_AVAILABLE:
        return _FallbackNLP()

    model_map = {
        "English": "en_core_web_sm",
        "German": "de_core_news_sm",
        "Spanish": "es_core_news_sm",
        "French": "fr_core_news_sm",
        "Japanese": "ja_core_news_sm",
        "Hindi": "en_core_web_sm"  # Fallback to English for Hindi
    }
    
    model_name = model_map.get(language, "en_core_web_sm")
    
    if model_name not in nlp_models:
        try:
            nlp_models[model_name] = spacy.load(model_name)
        except Exception:
            # If model not found, try downloading or use blank
            try:
                spacy.cli.download(model_name)
                nlp_models[model_name] = spacy.load(model_name)
            except Exception:
                if SPACY_AVAILABLE:
                    nlp_models[model_name] = spacy.blank("en")
                else:
                    nlp_models[model_name] = _FallbackNLP()
    
    return nlp_models[model_name]

class GrammarCorrector:
    """Grammar correction service using NLP"""
    
    # Common grammar rules and patterns
    GRAMMAR_RULES = {
        "subject_verb_agreement": {
            "pattern": r"\b(he|she|it)\s+(have|are|were)\b",
            "explanation": "Subject-verb agreement: singular subjects need singular verbs"
        },
        "subject_verb_agreement_plural": {
            "pattern": r"\b(I|we|you|they)\s+(has|is|was)\b",
            "explanation": "Subject-verb agreement: plural subjects need plural verbs"
        },
        "article_usage": {
            "pattern": r"\b(a)\s+[aeiou]",
            "explanation": "Use 'an' before words starting with vowel sounds"
        },
        "article_usage_an": {
            "pattern": r"\b(an)\s+[^aeiou]",
            "explanation": "Use 'a' before words starting with consonant sounds"
        },
        "double_negative": {
            "pattern": r"\b(don't|doesn't|won't|can't)\s+\w+\s+no\b",
            "explanation": "Avoid double negatives in standard English"
        },
        "tense_consistency": {
            "pattern": r"\b(yesterday|last\s+\w+)\s+\w+\s+(is|are|am)\b",
            "explanation": "Past time expressions require past tense verbs"
        },
        "missing_capital_i": {
            "pattern": r"\b(i)\s+(am|have|will|can|should|would|could|must)",
            "explanation": "The pronoun 'I' should always be capitalized"
        }
    }
    
    # Common corrections dictionary
    COMMON_CORRECTIONS = {
        "doesnt": "doesn't",
        "dont": "don't",
        "wont": "won't",
        "cant": "can't",
        "im": "I'm",
        "youre": "you're",
        "theyre": "they're",
        "theres": "there's",
        "its": "it's",  # When used as contraction
        "couldnt": "couldn't",
        "shouldnt": "shouldn't",
        "wouldnt": "wouldn't",
        "alot": "a lot",
        "definately": "definitely",
        "seperate": "separate",
        "occured": "occurred",
        "recieve": "receive",
        "wich": "which",
        "becuz": "because",
        "ur": "your",
        "ur": "you're",
        "teh": "the",
        "taht": "that",
        "wihch": "which",
        "thier": "their",
        "havent": "haven't",
        "isnt": "isn't",
        "arent": "aren't",
        "wasnt": "wasn't",
        "werent": "weren't",
    }

    # Common beginner word-order/phrase fixes (best-effort).
    # These are applied directly to the corrected sentence.
    COMMON_REPHRASES = [
        {
            "type": "punctuation",
            "pattern": r"^\s*(hi|hello)\s+",
            "replacement": r"\1, ",
            "explanation": "Add a comma after greetings like 'Hi' or 'Hello'.",
        },
        {
            "type": "word_order",
            "pattern": r"\bmy\s+name\s+(\w+)\s+is\b",
            "replacement": r"my name is \1",
            "explanation": "Word order: Say 'my name is [name]' not 'my name [name] is'.",
        },
        {
            "type": "word_order",
            "pattern": r"\bmy\s+is\s+([A-Za-z][A-Za-z\-']{0,40})\s+name\b",
            "replacement": r"my name is \1",
            "explanation": "Word order: Say 'my name is [name]' (not 'my is [name] name').",
        },
        {
            "type": "word_order",
            "pattern": r"\bname\s+my\s+is\s+([A-Za-z][A-Za-z\-']{0,40})\b",
            "replacement": r"my name is \1",
            "explanation": "Word order: In English, say 'my name is ...' (not 'name my is ...').",
        },
        {
            "type": "word_order",
            "pattern": r"\bname\s+my\s+is\b",
            "replacement": "my name is",
            "explanation": "Word order: In English, say 'my name is ...' (not 'name my is ...').",
        },
    ]
    
    def __init__(self, language: str = "English"):
        self.language = language
        self.nlp = get_nlp_model(language)
        self._spellchecker = None
        if self.language == "English" and SPELLCHECK_AVAILABLE:
            try:
                self._spellchecker = SpellChecker()
                # Add common contractions and informal forms so we don't flag them.
                self._spellchecker.word_frequency.load_words(list(self.COMMON_CORRECTIONS.keys()))
                self._spellchecker.word_frequency.load_words(list(self.COMMON_CORRECTIONS.values()))
            except Exception:
                self._spellchecker = None
    
    def correct_sentence(self, sentence: str) -> Dict:
        """Correct grammar errors in a sentence"""
        doc = self.nlp(sentence)
        errors = []
        corrected = sentence
        
        # Check for spelling/common errors
        words = sentence.split()
        for i, word in enumerate(words):
            lower_word = word.lower().strip(".,!?;:'\"")
            if lower_word in self.COMMON_CORRECTIONS:
                errors.append({
                    "type": "spelling",
                    "original": word,
                    "correction": self.COMMON_CORRECTIONS[lower_word],
                    "explanation": f"'{word}' should be '{self.COMMON_CORRECTIONS[lower_word]}'"
                })
                corrected = corrected.replace(word, self.COMMON_CORRECTIONS[lower_word])
        
        # Check grammar rules
        for rule_name, rule_info in self.GRAMMAR_RULES.items():
            matches = re.finditer(rule_info["pattern"], sentence.lower())
            for match in matches:
                errors.append({
                    "type": rule_name,
                    "original": match.group(),
                    "correction": self._suggest_correction(rule_name, match.group()),
                    "explanation": rule_info["explanation"]
                })

        # Apply common rephrases/word-order fixes (primarily English).
        # This happens after rule detection so the corrected output is more helpful.
        for fix in self.COMMON_REPHRASES:
            try:
                match = re.search(fix["pattern"], corrected, flags=re.IGNORECASE)
                if not match:
                    continue

                original_fragment = match.group(0)
                corrected_fragment = re.sub(
                    fix["pattern"],
                    fix["replacement"],
                    original_fragment,
                    flags=re.IGNORECASE,
                )

                errors.append({
                    "type": fix["type"],
                    "original": original_fragment,
                    "correction": corrected_fragment,
                    "explanation": fix["explanation"],
                })

                corrected = re.sub(
                    fix["pattern"],
                    fix["replacement"],
                    corrected,
                    flags=re.IGNORECASE,
                )
            except Exception:
                continue

        # Spellcheck (English only) after common fixes so suggestions are cleaner.
        if self._spellchecker and corrected:
            spelling_errors, corrected = self._spellcheck_sentence(corrected)
            errors.extend(spelling_errors)

        # If the sentence includes a name pattern, capitalize the name.
        if self.language == "English" and corrected:
            def _cap_name(match: re.Match) -> str:
                return f"{match.group(1)} {match.group(2).capitalize()}"

            corrected = re.sub(
                r"\b(my\s+name\s+is)\s+([a-z][a-z\-']{0,40})\b",
                _cap_name,
                corrected,
                flags=re.IGNORECASE,
            )

        if self.language == "English" and corrected:
            corrected = corrected.strip()
            if corrected and corrected[0].islower():
                corrected = corrected[0].upper() + corrected[1:]
        
        # Check sentence structure using spaCy (prefer the corrected text so we don't
        # incorrectly flag issues that were already fixed above).
        doc_for_structure = self.nlp(corrected) if corrected else doc
        structure_errors = self._check_sentence_structure(doc_for_structure)
        errors.extend(structure_errors)
        
        # Calculate score
        score = max(0, 100 - (len(errors) * 15))
        
        # Generate alternative sentence
        alternative = self._generate_alternative(corrected)
        
        return {
            "original": sentence,
            "corrected": corrected,
            "errors": errors,
            "has_errors": len(errors) > 0,
            "score": score,
            "alternative": alternative
        }

    def _spellcheck_sentence(self, sentence: str) -> Tuple[List[Dict], str]:
        """Return (errors, corrected_sentence) based on spellchecking."""
        errors: List[Dict] = []
        corrected = sentence

        if not self._spellchecker:
            return errors, corrected

        tokens = re.findall(r"[A-Za-z\-']+", sentence)
        if not tokens:
            return errors, corrected

        # Avoid false positives for likely names after "name is".
        lower_tokens = [t.lower() for t in tokens]
        skip_words = set()
        for idx in range(2, len(lower_tokens)):
            if lower_tokens[idx - 2] == "name" and lower_tokens[idx - 1] == "is":
                skip_words.add(lower_tokens[idx])

        candidates = []
        for t in tokens:
            lt = t.lower()
            if len(lt) <= 1:
                continue
            if lt in skip_words:
                continue
            if t[:1].isupper():
                continue
            candidates.append(lt)

        unknown = sorted(self._spellchecker.unknown(candidates))
        seen = set()
        for word in unknown:
            if word in seen:
                continue
            seen.add(word)

            suggestion = self._spellchecker.correction(word)
            if not suggestion or suggestion == word:
                continue

            errors.append({
                "type": "spelling",
                "original": word,
                "correction": suggestion,
                "explanation": f"Spelling: '{word}' should be '{suggestion}'.",
            })

            try:
                corrected = re.sub(
                    rf"\b{re.escape(word)}\b",
                    suggestion,
                    corrected,
                    flags=re.IGNORECASE,
                )
            except Exception:
                continue

        return errors, corrected
    
    def _suggest_correction(self, rule_name: str, text: str) -> str:
        """Suggest correction for a grammar rule violation"""
        corrections = {
            "subject_verb_agreement": lambda t: t.replace("have", "has").replace("are", "is").replace("were", "was"),
            "subject_verb_agreement_plural": lambda t: t.replace("has", "have").replace("is", "are").replace("was", "were"),
            "article_usage": lambda t: t.replace("a ", "an "),
            "article_usage_an": lambda t: t.replace("an ", "a "),
            "double_negative": lambda t: t.replace(" no", " any"),
            "tense_consistency": lambda t: t.replace("is", "was").replace("are", "were").replace("am", "was"),
            "missing_capital_i": lambda t: t.replace(" i ", " I ").replace(" i\t", " I\t").replace(" i\n", " I\n")
        }
        
        if rule_name in corrections:
            return corrections[rule_name](text)
        return text
    
    def _check_sentence_structure(self, doc) -> List[Dict]:
        """Check sentence structure using spaCy analysis"""
        errors = []

        if not self._has_linguistic_annotations(doc):
            return self._check_sentence_structure_fallback(doc)
        
        # Check for missing subjects or verbs
        has_subject = any(token.dep_ in ["nsubj", "nsubjpass"] for token in doc)
        has_verb = any(token.pos_ == "VERB" or token.tag_ in ["VB", "VBD", "VBG", "VBN", "VBP", "VBZ"] for token in doc)
        root = next((token for token in doc if token.dep_ == "ROOT"), None)
        
        if not has_subject and len(doc) > 3:
            errors.append({
                "type": "structure",
                "original": doc.text,
                "correction": "Consider adding a subject",
                "explanation": "A complete sentence typically needs a subject."
            })
        
        if not has_verb and len(doc) > 2:
            errors.append({
                "type": "structure",
                "original": doc.text,
                "correction": "Consider adding a verb",
                "explanation": "A complete sentence typically needs a verb."
            })

        # Catch sentences where spaCy finds a verb, but the clause is still malformed.
        # This helps beginner inputs like "i name in suyash" that have a verb-like token
        # but no real object or complement.
        if root and root.pos_ == "VERB" and len(doc) >= 4:
            has_object = any(token.dep_ in ["dobj", "obj", "attr", "oprd", "acomp"] for token in doc)
            has_subject_verb_phrase = has_subject and root.head == root
            has_prep_phrase = any(token.dep_ == "prep" for token in doc)

            if has_subject_verb_phrase and has_prep_phrase and not has_object:
                errors.append({
                    "type": "structure",
                    "original": doc.text,
                    "correction": "Rewrite the sentence with a complete verb phrase and object.",
                    "explanation": "This sentence has a subject and a verb, but the clause is incomplete or unnatural in English."
                })
        
        return errors

    def _has_linguistic_annotations(self, doc) -> bool:
        """Return True when parser/tagger annotations are present."""
        if not doc:
            return False

        return any(
            getattr(token, "dep_", "") or getattr(token, "pos_", "") or getattr(token, "tag_", "")
            for token in doc
        )

    def _check_sentence_structure_fallback(self, doc) -> List[Dict]:
        """Heuristic checks when POS/dependency tags are not available."""
        errors = []

        raw_tokens = [re.sub(r"[^A-Za-z']", "", token.text) for token in doc]
        tokens = [token for token in raw_tokens if token]

        if len(tokens) <= 2:
            return errors

        lower_tokens = [token.lower() for token in tokens]
        subject_pronouns = {"i", "you", "he", "she", "it", "we", "they"}
        non_subject_determiners = {
            "a", "an", "the",
            "my", "your", "his", "her", "our", "their",
            "this", "that", "these", "those",
        }
        verb_words = {
            "am", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did",
            "can", "could", "will", "would", "shall", "should", "may", "might", "must"
        }

        # Common contracted/negated auxiliaries (when punctuation is stripped, these still contain ').
        verb_words.update({
            "don't", "doesn't", "didn't",
            "can't", "won't", "wouldn't", "shouldn't", "couldn't",
            "isn't", "aren't", "wasn't", "weren't",
            "haven't", "hasn't", "hadn't",
            "i'm", "you're", "we're", "they're", "it's", "there's",
        })

        verb_index = next(
            (
                idx for idx, token in enumerate(lower_tokens)
                if token in verb_words or token.endswith("ed") or token.endswith("ing")
            ),
            -1,
        )

        has_verb = verb_index != -1
        has_subject = False

        if has_verb and verb_index > 0:
            # Only treat the token before the verb as a subject if it looks like a noun/pronoun,
            # not a determiner/possessive (e.g. "my is ..." is not a valid subject).
            subject_candidate = lower_tokens[verb_index - 1]
            if subject_candidate in subject_pronouns:
                has_subject = True
            elif subject_candidate not in non_subject_determiners:
                has_subject = True

        # Special-case: "my name is" style phrases imply a subject even if word order is odd.
        if not has_subject and has_verb and "my" in lower_tokens and "name" in lower_tokens:
            has_subject = True

        if not has_subject and lower_tokens and lower_tokens[0] in subject_pronouns:
            has_subject = True

        if not has_subject and len(tokens) > 3:
            errors.append({
                "type": "structure",
                "original": doc.text,
                "correction": "Consider adding a subject",
                "explanation": "A complete sentence typically needs a subject."
            })

        if not has_verb and len(tokens) > 2:
            errors.append({
                "type": "structure",
                "original": doc.text,
                "correction": "Consider adding a verb",
                "explanation": "A complete sentence typically needs a verb."
            })

        return errors
    
    def _generate_alternative(self, sentence: str) -> str:
        """Generate an alternative improved sentence"""
        doc = self.nlp(sentence)
        
        # Simple improvements
        alternatives = [
            sentence,
            sentence.capitalize() if not sentence[0].isupper() else sentence,
        ]
        
        # Add formal alternative
        informal_formal = {
            "gonna": "going to",
            "wanna": "want to",
            "gotta": "have to",
            "kinda": "kind of",
            "sorta": "sort of",
            "dunno": "don't know",
            "cause": "because",
        }
        
        alt = sentence
        for informal, formal in informal_formal.items():
            alt = alt.replace(informal, formal)
        
        if alt != sentence:
            return alt
        
        return sentence


class TranslationService:
    """Translation service using Google Translate"""
    
    # Language codes for Google Translate
    LANGUAGE_CODES = {
        "English": "en",
        "German": "de",
        "Spanish": "es",
        "French": "fr",
        "Japanese": "ja",
        "Hindi": "hi"
    }
    
    def __init__(self):
        self._phrase_to_english = {}
        self._build_reverse_dictionary()

        self.libretranslate_urls = self._get_libretranslate_urls()
        self.libretranslate_api_key = os.getenv("LIBRETRANSLATE_API_KEY")
        try:
            self.libretranslate_timeout = float(os.getenv("LIBRETRANSLATE_TIMEOUT", "8"))
        except Exception:
            self.libretranslate_timeout = 8.0

        try:
            from googletrans import Translator
            self.translator = Translator()
            self.use_api = True
        except Exception:
            self.translator = None
            self.use_api = False

    def _get_libretranslate_urls(self) -> List[str]:
        raw_urls = os.getenv("LIBRETRANSLATE_URLS")
        if raw_urls:
            urls = [url.strip().rstrip("/") for url in raw_urls.split(",") if url.strip()]
            return urls

        default_url = os.getenv("LIBRETRANSLATE_URL", "https://libretranslate.de")
        return [default_url.strip().rstrip("/")]

    def _build_reverse_dictionary(self) -> None:
        """Build phrase -> English lookup from the English translation table."""
        english_map = self.TRANSLATIONS.get("English", {})
        for english_phrase, translations in english_map.items():
            if not isinstance(translations, dict):
                continue
            for language, phrase in translations.items():
                if not phrase:
                    continue
                normalized = str(phrase).lower().strip()
                if not normalized:
                    continue

                lang_map = self._phrase_to_english.setdefault(language, {})
                # Keep the first mapping to avoid overrides (e.g. "hola" could map to both "hello" and "hi").
                lang_map.setdefault(normalized, english_phrase)

    def _dictionary_translate(self, text: str, source_lang: str, target_lang: str) -> Optional[Dict]:
        """Translate using the small built-in phrase table (supports non-English sources via English pivot)."""
        cleaned = text.lower().strip()
        if not cleaned:
            return None

        # Resolve to an English pivot phrase when needed.
        english_phrase = None
        if source_lang == "English":
            if cleaned in self.TRANSLATIONS.get("English", {}):
                english_phrase = cleaned
        else:
            english_phrase = self._phrase_to_english.get(source_lang, {}).get(cleaned)

        if not english_phrase:
            return None

        if target_lang == "English":
            translated = english_phrase
        else:
            translated = self.TRANSLATIONS.get("English", {}).get(english_phrase, {}).get(target_lang)

        if not translated:
            return None

        return {
            "original": text,
            "translated": translated,
            "explanation": f"Direct translation from {source_lang} to {target_lang}",
            "alternatives": [str(translated).capitalize()],
            "grammar_notes": f"This is a common phrase in {target_lang}.",
            "cultural_notes": None,
        }

    def _translate_with_libretranslate(self, text: str, source_lang: str, target_lang: str) -> Optional[Dict]:
        """Translate using LibreTranslate-compatible HTTP API."""
        src_code = self.LANGUAGE_CODES.get(source_lang)
        dest_code = self.LANGUAGE_CODES.get(target_lang)
        if not src_code or not dest_code:
            return None

        payload = {
            "q": text,
            "source": src_code,
            "target": dest_code,
            "format": "text",
        }
        if self.libretranslate_api_key:
            payload["api_key"] = self.libretranslate_api_key

        for base_url in self.libretranslate_urls:
            try:
                response = requests.post(
                    f"{base_url}/translate",
                    json=payload,
                    timeout=self.libretranslate_timeout,
                )
                if response.status_code >= 400:
                    continue

                data = response.json() if response.content else {}
                translated = data.get("translatedText")
                if not translated:
                    continue

                return {
                    "original": text,
                    "translated": translated,
                    "explanation": f"Translated from {source_lang} to {target_lang}",
                    "alternatives": [translated.capitalize(), translated.lower()],
                    "grammar_notes": None,
                    "cultural_notes": None,
                }
            except Exception:
                continue

        return None

    def _translate_with_mymemory(self, text: str, source_lang: str, target_lang: str) -> Optional[Dict]:
        """Translate using the free MyMemory API (best-effort fallback)."""
        src_code = self.LANGUAGE_CODES.get(source_lang)
        dest_code = self.LANGUAGE_CODES.get(target_lang)
        if not src_code or not dest_code:
            return None

        try:
            response = requests.get(
                "https://api.mymemory.translated.net/get",
                params={"q": text, "langpair": f"{src_code}|{dest_code}"},
                timeout=self.libretranslate_timeout,
            )
            if response.status_code >= 400:
                return None

            data = response.json() if response.content else {}
            translated = (data.get("responseData") or {}).get("translatedText")
            if not translated:
                return None

            return {
                "original": text,
                "translated": translated,
                "explanation": f"Translated from {source_lang} to {target_lang}",
                "alternatives": [translated.capitalize(), translated.lower()],
                "grammar_notes": None,
                "cultural_notes": None,
            }
        except Exception:
            return None
    
    # Simple translation dictionaries for fallback
    TRANSLATIONS = {
        "English": {
            "hello": {"German": "hallo", "Spanish": "hola", "French": "bonjour", "Japanese": "こんにちは", "Hindi": "नमस्ते"},
            "hi": {"German": "hallo", "Spanish": "hola", "French": "salut", "Japanese": "こんにちは", "Hindi": "नमस्ते"},
            "goodbye": {"German": "auf wiedersehen", "Spanish": "adiós", "French": "au revoir", "Japanese": "さようなら", "Hindi": "अलविदा"},
            "thank you": {"German": "danke", "Spanish": "gracias", "French": "merci", "Japanese": "ありがとう", "Hindi": "धन्यवाद"},
            "thanks": {"German": "danke", "Spanish": "gracias", "French": "merci", "Japanese": "ありがとう", "Hindi": "धन्यवाद"},
            "please": {"German": "bitte", "Spanish": "por favor", "French": "s'il vous plaît", "Japanese": "お願いします", "Hindi": "कृपया"},
            "yes": {"German": "ja", "Spanish": "sí", "French": "oui", "Japanese": "はい", "Hindi": "हां"},
            "no": {"German": "nein", "Spanish": "no", "French": "non", "Japanese": "いいえ", "Hindi": "नहीं"},
            "good morning": {"German": "guten Morgen", "Spanish": "buenos días", "French": "bonjour", "Japanese": "おはようございます", "Hindi": "सुप्रभात"},
            "good night": {"German": "gute Nacht", "Spanish": "buenas noches", "French": "bonne nuit", "Japanese": "おやすみなさい", "Hindi": "शुभ रात्रि"},
            "how are you": {"German": "wie geht es dir", "Spanish": "cómo estás", "French": "comment allez-vous", "Japanese": "お元気ですか", "Hindi": "आप कैसे हैं"},
            "i love you": {"German": "ich liebe dich", "Spanish": "te quiero", "French": "je t'aime", "Japanese": "愛しています", "Hindi": "मैं तुमसे प्यार करता हूं"},
            "good": {"German": "gut", "Spanish": "bueno", "French": "bon", "Japanese": "良い", "Hindi": "अच्छा"},
            "bad": {"German": "schlecht", "Spanish": "malo", "French": "mauvais", "Japanese": "悪い", "Hindi": "बुरा"},
            "water": {"German": "Wasser", "Spanish": "agua", "French": "eau", "Japanese": "水", "Hindi": "पानी"},
            "food": {"German": "Essen", "Spanish": "comida", "French": "nourriture", "Japanese": "食べ物", "Hindi": "खाना"},
            "friend": {"German": "Freund", "Spanish": "amigo", "French": "ami", "Japanese": "友達", "Hindi": "दोस्त"},
            "family": {"German": "Familie", "Spanish": "familia", "French": "famille", "Japanese": "家族", "Hindi": "परिवार"},
            "house": {"German": "Haus", "Spanish": "casa", "French": "maison", "Japanese": "家", "Hindi": "घर"},
            "car": {"German": "Auto", "Spanish": "coche", "French": "voiture", "Japanese": "車", "Hindi": "कार"},
            "book": {"German": "Buch", "Spanish": "libro", "French": "livre", "Japanese": "本", "Hindi": "किताब"},
            "school": {"German": "Schule", "Spanish": "escuela", "French": "école", "Japanese": "学校", "Hindi": "स्कूल"},
            "work": {"German": "Arbeit", "Spanish": "trabajo", "French": "travail", "Japanese": "仕事", "Hindi": "काम"},
            "love": {"German": "Liebe", "Spanish": "amor", "French": "amour", "Japanese": "愛", "Hindi": "प्यार"},
            "happy": {"German": "glücklich", "Spanish": "feliz", "French": "heureux", "Japanese": "幸せ", "Hindi": "खुश"},
            "sad": {"German": "traurig", "Spanish": "triste", "French": "triste", "Japanese": "悲しい", "Hindi": "उदास"},
            "beautiful": {"German": "schön", "Spanish": "hermoso", "French": "beau", "Japanese": "美しい", "Hindi": "सुंदर"},
            "big": {"German": "groß", "Spanish": "grande", "French": "grand", "Japanese": "大きい", "Hindi": "बड़ा"},
            "small": {"German": "klein", "Spanish": "pequeño", "French": "petit", "Japanese": "小さい", "Hindi": "छोटा"},
            "new": {"German": "neu", "Spanish": "nuevo", "French": "nouveau", "Japanese": "新しい", "Hindi": "नया"},
            "old": {"German": "alt", "Spanish": "viejo", "French": "vieux", "Japanese": "古い", "Hindi": "पुराना"},
            "hot": {"German": "heiß", "Spanish": "caliente", "French": "chaud", "Japanese": "熱い", "Hindi": "गरम"},
            "cold": {"German": "kalt", "Spanish": "frío", "French": "froid", "Japanese": "冷たい", "Hindi": "ठंडा"},
            "today": {"German": "heute", "Spanish": "hoy", "French": "aujourd'hui", "Japanese": "今日", "Hindi": "आज"},
            "tomorrow": {"German": "morgen", "Spanish": "mañana", "French": "demain", "Japanese": "明日", "Hindi": "कल"},
            "yesterday": {"German": "gestern", "Spanish": "ayer", "French": "hier", "Japanese": "昨日", "Hindi": "कल"},
            "what": {"German": "was", "Spanish": "qué", "French": "quoi", "Japanese": "何", "Hindi": "क्या"},
            "where": {"German": "wo", "Spanish": "dónde", "French": "où", "Japanese": "どこ", "Hindi": "कहां"},
            "when": {"German": "wann", "Spanish": "cuándo", "French": "quand", "Japanese": "いつ", "Hindi": "कब"},
            "why": {"German": "warum", "Spanish": "por qué", "French": "pourquoi", "Japanese": "なぜ", "Hindi": "क्यों"},
            "who": {"German": "wer", "Spanish": "quién", "French": "qui", "Japanese": "誰", "Hindi": "कौन"},
            "how": {"German": "wie", "Spanish": "cómo", "French": "comment", "Japanese": "どうやって", "Hindi": "कैसे"},
            "eat": {"German": "essen", "Spanish": "comer", "French": "manger", "Japanese": "食べる", "Hindi": "खाना"},
            "drink": {"German": "trinken", "Spanish": "beber", "French": "boire", "Japanese": "飲む", "Hindi": "पीना"},
            "sleep": {"German": "schlafen", "Spanish": "dormir", "French": "dormir", "Japanese": "寝る", "Hindi": "सोना"},
            "go": {"German": "gehen", "Spanish": "ir", "French": "aller", "Japanese": "行く", "Hindi": "जाना"},
            "come": {"German": "kommen", "Spanish": "venir", "French": "venir", "Japanese": "来る", "Hindi": "आना"},
            "see": {"German": "sehen", "Spanish": "ver", "French": "voir", "Japanese": "見る", "Hindi": "देखना"},
            "hear": {"German": "hören", "Spanish": "oír", "French": "entendre", "Japanese": "聞く", "Hindi": "सुनना"},
            "speak": {"German": "sprechen", "Spanish": "hablar", "French": "parler", "Japanese": "話す", "Hindi": "बोलना"},
            "read": {"German": "lesen", "Spanish": "leer", "French": "lire", "Japanese": "読む", "Hindi": "पढ़ना"},
            "write": {"German": "schreiben", "Spanish": "escribir", "French": "écrire", "Japanese": "書く", "Hindi": "लिखना"},
            "learn": {"German": "lernen", "Spanish": "aprender", "French": "apprendre", "Japanese": "学ぶ", "Hindi": "सीखना"},
            "teach": {"German": "lehren", "Spanish": "enseñar", "French": "enseigner", "Japanese": "教える", "Hindi": "सिखाना"},
            "help": {"German": "helfen", "Spanish": "ayudar", "French": "aider", "Japanese": "助ける", "Hindi": "मदद करना"},
            "want": {"German": "wollen", "Spanish": "querer", "French": "vouloir", "Japanese": "欲しい", "Hindi": "चाहना"},
            "need": {"German": "brauchen", "Spanish": "necesitar", "French": "avoir besoin", "Japanese": "必要", "Hindi": "जरूरत"},
            "can": {"German": "können", "Spanish": "poder", "French": "pouvoir", "Japanese": "できる", "Hindi": "सकना"},
            "must": {"German": "müssen", "Spanish": "deber", "French": "devoir", "Japanese": "しなければならない", "Hindi": "चाहिए"},
            "one": {"German": "eins", "Spanish": "uno", "French": "un", "Japanese": "一", "Hindi": "एक"},
            "two": {"German": "zwei", "Spanish": "dos", "French": "deux", "Japanese": "二", "Hindi": "दो"},
            "three": {"German": "drei", "Spanish": "tres", "French": "trois", "Japanese": "三", "Hindi": "तीन"},
            "four": {"German": "vier", "Spanish": "cuatro", "French": "quatre", "Japanese": "四", "Hindi": "चार"},
            "five": {"German": "fünf", "Spanish": "cinco", "French": "cinq", "Japanese": "五", "Hindi": "पांच"},
            "ten": {"German": "zehn", "Spanish": "diez", "French": "dix", "Japanese": "十", "Hindi": "दस"},
            "hundred": {"German": "hundert", "Spanish": "cien", "French": "cent", "Japanese": "百", "Hindi": "सौ"},
            "thousand": {"German": "tausend", "Spanish": "mil", "French": "mille", "Japanese": "千", "Hindi": "हजार"},
            "i": {"German": "ich", "Spanish": "yo", "French": "je", "Japanese": "私", "Hindi": "मैं"},
            "you": {"German": "du", "Spanish": "tú", "French": "tu", "Japanese": "あなた", "Hindi": "तुम"},
            "he": {"German": "er", "Spanish": "él", "French": "il", "Japanese": "彼", "Hindi": "वह"},
            "she": {"German": "sie", "Spanish": "ella", "French": "elle", "Japanese": "彼女", "Hindi": "वह"},
            "we": {"German": "wir", "Spanish": "nosotros", "French": "nous", "Japanese": "私たち", "Hindi": "हम"},
            "they": {"German": "sie", "Spanish": "ellos", "French": "ils", "Japanese": "彼ら", "Hindi": "वे"},
            "my name is": {"German": "mein Name ist", "Spanish": "me llamo", "French": "je m'appelle", "Japanese": "私の名前は", "Hindi": "मेरा नाम है"},
            "excuse me": {"German": "Entschuldigung", "Spanish": "disculpe", "French": "excusez-moi", "Japanese": "すみません", "Hindi": "माफ कीजिए"},
            "sorry": {"German": "Entschuldigung", "Spanish": "lo siento", "French": "désolé", "Japanese": "ごめんなさい", "Hindi": "माफ करें"},
            "welcome": {"German": "willkommen", "Spanish": "bienvenido", "French": "bienvenue", "Japanese": "ようこそ", "Hindi": "स्वागत है"},
        }
    }
    
    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict:
        """Translate text between languages"""
        # 1) Fast offline phrase translation (supports non-English sources).
        dict_result = self._dictionary_translate(text, source_lang, target_lang)
        if dict_result:
            return dict_result

        # 2) Try Google Translate (if dependency is installed).
        if self.use_api and self.translator:
            try:
                src_code = self.LANGUAGE_CODES.get(source_lang, "en")
                dest_code = self.LANGUAGE_CODES.get(target_lang, "es")

                result = self.translator.translate(text, src=src_code, dest=dest_code)
                translated = getattr(result, "text", None)
                if translated:
                    pronunciation = getattr(result, "pronunciation", None)
                    return {
                        "original": text,
                        "translated": translated,
                        "explanation": f"Translated from {source_lang} to {target_lang}",
                        "alternatives": [translated.capitalize(), translated.lower()],
                        "grammar_notes": f"Pronunciation: {pronunciation}" if pronunciation else None,
                        "cultural_notes": None,
                    }
            except Exception as e:
                print(f"Translation API error (googletrans): {e}")

        # 3) Try LibreTranslate-compatible HTTP API (no extra dependencies).
        libre_result = self._translate_with_libretranslate(text, source_lang, target_lang)
        if libre_result:
            return libre_result

        # 3b) Try MyMemory API as another lightweight fallback.
        mymemory_result = self._translate_with_mymemory(text, source_lang, target_lang)
        if mymemory_result:
            return mymemory_result

        # 4) Last resort: word-by-word dictionary translation (via English pivot for non-English sources).
        words = text.lower().split()
        translated_words: List[str] = []

        for word in words:
            clean_word = word.strip(".,!?;:'\"")
            replacement = None

            # Resolve to English.
            english_phrase = None
            if source_lang == "English":
                if clean_word in self.TRANSLATIONS.get("English", {}):
                    english_phrase = clean_word
            else:
                english_phrase = self._phrase_to_english.get(source_lang, {}).get(clean_word)

            if english_phrase:
                if target_lang == "English":
                    replacement = english_phrase
                else:
                    replacement = self.TRANSLATIONS.get("English", {}).get(english_phrase, {}).get(target_lang)

            translated_words.append(replacement if replacement else word)

        translated_text = " ".join(translated_words)

        if translated_text.lower() == text.lower():
            return {
                "original": text,
                "translated": text,
                "explanation": "Translation service unavailable for this text.",
                "alternatives": [],
                "grammar_notes": "Tip: Try shorter text or common phrases (e.g., 'hello', 'thank you').",
                "cultural_notes": None,
            }

        return {
            "original": text,
            "translated": translated_text,
            "explanation": f"Basic word-by-word translation from {source_lang} to {target_lang}",
            "alternatives": [translated_text.capitalize()],
            "grammar_notes": "Note: This is a basic word-by-word translation.",
            "cultural_notes": None,
        }


class ConversationService:
    """Conversation practice service"""

    BASIC_DEFINITIONS = {
        "hello": "a greeting used when you meet someone or start a conversation",
        "hi": "a short, friendly way to say 'hello'",
        "goodbye": "something you say when you are leaving",
        "please": "a polite word used when you ask for something",
        "thanks": "a casual way to say 'thank you'",
        "thank you": "a polite way to show gratitude",
        "taxi": "a car with a driver that you pay to take you somewhere (also called a 'cab')",
        "cab": "another word for a taxi",
        "mission": "a task or goal you need to complete",
        "vocabulary": "the words you know and use in a language",
        "translation": "changing text from one language into another",
        "grammar": "the rules for how words and sentences are formed",
    }
    
    SCENARIOS = {
        "restaurant": {
            "name": "Restaurant Ordering",
            "description": "Practice ordering food at a restaurant",
            "suggested_phrases": [
                "I would like to order...",
                "May I have the menu please?",
                "What do you recommend?",
                "Could I have the check please?"
            ]
        },
        "interview": {
            "name": "Job Interview",
            "description": "Practice for a job interview",
            "suggested_phrases": [
                "I have experience in...",
                "My strengths include...",
                "I am passionate about...",
                "Could you tell me more about the role?"
            ]
        },
        "travel": {
            "name": "Travel & Directions",
            "description": "Practice asking for directions and travel situations",
            "suggested_phrases": [
                "Excuse me, how do I get to...?",
                "Where is the nearest...?",
                "How long does it take to...?",
                "Is this the right way to...?"
            ]
        },
        "shopping": {
            "name": "Shopping",
            "description": "Practice shopping conversations",
            "suggested_phrases": [
                "How much does this cost?",
                "Do you have this in a different size?",
                "I'm just browsing, thank you.",
                "I'll take this one, please."
            ]
        },
        "casual": {
            "name": "Casual Conversation",
            "description": "Practice everyday casual conversations",
            "suggested_phrases": [
                "How was your day?",
                "What are your hobbies?",
                "Have you seen any good movies lately?",
                "What do you think about...?"
            ]
        }
    }
    
    # AI responses by difficulty level
    LEVEL_RESPONSES = {
        "A1": {
            "vocabulary": "simple",
            "sentence_length": "short",
            "topics": ["greetings", "numbers", "colors", "family", "food"]
        },
        "A2": {
            "vocabulary": "basic",
            "sentence_length": "medium",
            "topics": ["daily routines", "shopping", "weather", "hobbies"]
        },
        "B1": {
            "vocabulary": "intermediate",
            "sentence_length": "medium",
            "topics": ["travel", "work", "health", "education"]
        },
        "B2": {
            "vocabulary": "upper-intermediate",
            "sentence_length": "long",
            "topics": ["current events", "culture", "opinions", "abstract ideas"]
        },
        "C1": {
            "vocabulary": "advanced",
            "sentence_length": "complex",
            "topics": ["professional discussions", "debates", "nuanced topics"]
        },
        "C2": {
            "vocabulary": "native-like",
            "sentence_length": "varied",
            "topics": ["any topic", "idioms", "cultural nuances"]
        }
    }
    
    def __init__(self, language: str = "English", level: str = "A1"):
        self.language = language
        self.level = level
        self.nlp = get_nlp_model(language)

        self._openai_api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
        self._openai_base_url = (os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1").strip().rstrip("/")
        self._openai_model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()

    def _strip_help_prefix(self, message: str) -> str:
        # HelpChatbox sends a prefix like: "[Current page: /missions] ..."
        return re.sub(r"^\[\s*current\s+page\s*:\s*[^\]]+\]\s*", "", message.strip(), flags=re.IGNORECASE)

    def _extract_definition_term(self, message: str) -> Optional[str]:
        text = self._strip_help_prefix(message)

        patterns = [
            r"\bmeaning\s+of\s+(?P<term>.+)$",
            r"\bwhat\s+is\s+the\s+meaning\s+of\s+(?P<term>.+)$",
            r"\bwhat\s+does\s+(?P<term>.+?)\s+mean\b",
            r"\bdefine\s+(?P<term>.+)$",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match and match.groupdict().get("term"):
                term = match.group("term")
                term = re.sub(r"[\?\!\.,;:]+$", "", term).strip()
                term = term.strip('"\'“”‘’')
                term = re.sub(
                    r"\s+in\s+(english|german|spanish|french|japanese|hindi)\s*$",
                    "",
                    term,
                    flags=re.IGNORECASE,
                ).strip()
                # Keep it short and safe.
                if 1 <= len(term) <= 60:
                    return term

        return None

    def _format_definition_response(self, term: str) -> str:
        term_clean = term.strip()
        term_key = term_clean.lower()

        meaning = self.BASIC_DEFINITIONS.get(term_key)
        if meaning:
            response = f"'{term_clean}' means {meaning}."
        else:
            response = (
                f"I don't have a simple definition for '{term_clean}'. "
                "Can you use it in a sentence, or tell me which language it is from?"
            )

        # Try to include a target-language translation when the user is learning a non-English language.
        if self.language and self.language != "English":
            try:
                translation_service = TranslationService()
                translated = translation_service.translate(term_clean, "English", self.language).get("translated")
                if translated and translated.lower().strip() != term_key:
                    response += f" In {self.language}: {translated}."
            except Exception:
                pass

        # Add a simple example for common items.
        example_map = {
            "hello": "Example: 'Hello! How are you?'",
            "hi": "Example: 'Hi! Nice to meet you.'",
            "taxi": "Example: 'Can you call a taxi, please?'",
            "cab": "Example: 'We took a cab to the airport.'",
        }
        example = example_map.get(term_key)
        if example:
            response += f" {example}"

        return response

    def _openai_chat(self, messages: List[Dict[str, str]]) -> Optional[str]:
        if not self._openai_api_key:
            return None

        url = f"{self._openai_base_url}/chat/completions"
        payload = {
            "model": self._openai_model,
            "messages": messages,
            "temperature": 0.4,
        }

        try:
            response = requests.post(
                url,
                headers={
                    "Authorization": f"Bearer {self._openai_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=20,
            )
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                return None
            message = (choices[0].get("message") or {}).get("content")
            if not message:
                return None
            return str(message).strip()
        except Exception:
            return None

    def _generate_help_response(self, user_message: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        raw_message = user_message or ""
        prompt = self._strip_help_prefix(raw_message)
        page_match = re.search(r"\[\s*current\s+page\s*:\s*(?P<page>/[^\]]+)\]", raw_message, flags=re.IGNORECASE)
        current_page = (page_match.group("page") if page_match else "").strip()

        system = (
            "You are LangLearn AI Helper, an assistant inside a language-learning web app. "
            "Answer the user's questions and doubts about missions, conversation practice, translation, vocabulary, and grammar. "
            "Be clear, concise, and practical. If the user asks for a definition, give a short meaning and an example. "
            "If the user asks for translation, give 1–2 good options and explain briefly. "
            "If you are unsure, ask one clarifying question."
        )

        messages: List[Dict[str, str]] = [{"role": "system", "content": system}]

        # Add a small rolling history for better follow-ups.
        # Expected format: [{"user": "...", "ai": "..."}, ...]
        if history:
            for turn in history[-6:]:
                user_turn = (turn.get("user") or "").strip()
                ai_turn = (turn.get("ai") or "").strip()
                if user_turn:
                    messages.append({"role": "user", "content": self._strip_help_prefix(user_turn)})
                if ai_turn:
                    messages.append({"role": "assistant", "content": ai_turn})

        messages.append(
            {
                "role": "user",
                "content": (
                    f"Target language: {self.language}. Level: {self.level}.\n"
                    f"User message: {prompt}"
                ),
            }
        )

        llm_answer = self._openai_chat(messages)
        if llm_answer:
            return llm_answer

        prompt_lower = prompt.lower()
        if "taxi" in prompt_lower and ("mission" in prompt_lower or current_page == "/missions"):
            return (
                "Taxi mission steps:\n"
                "1) Hail the taxi (e.g., 'Excuse me! Taxi!')\n"
                "2) Tell the destination (e.g., 'Please take me to the airport.')\n"
                "3) Make small talk during the ride (e.g., 'Is it always busy here?')\n\n"
                "If you tell me what step you're stuck on, I'll give example messages that match it."
            )

        if "mission" in prompt_lower or current_page == "/missions":
            return (
                "Tell me the mission name and what you already said, and I’ll suggest the next correct line. "
                "Example: 'Taxi mission — I already hailed the taxi, what next?'"
            )

        if "translate" in prompt_lower or "translation" in prompt_lower:
            return "Tell me what you want to translate and the target language (e.g., 'translate: good morning to French')."

        if "grammar" in prompt_lower:
            return "Paste your sentence and I’ll explain what to fix and why."

        return (
            "I can help with missions, translation, vocabulary, and grammar. "
            "If you want full ChatGPT-like open-ended answers, set OPENAI_API_KEY (and optionally OPENAI_MODEL / OPENAI_BASE_URL) in backend/.env and restart the backend."
        )
    
    def get_response(
        self,
        user_message: str,
        scenario: str = "casual",
        response_count: int = 0,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict:
        """Generate a conversation response"""
        term = self._extract_definition_term(user_message)
        if term:
            return {
                "response": self._format_definition_response(term),
                "should_give_feedback": False,
                "response_count": response_count + 1,
            }

        if scenario == "help":
            return {
                "response": self._generate_help_response(user_message, history=history),
                "should_give_feedback": False,
                "response_count": response_count + 1,
            }

        doc = self.nlp(user_message)
        
        # Analyze user message
        sentiment = self._analyze_sentiment(doc)
        topics = self._extract_topics(doc)
        
        # Generate response based on scenario and level
        response = self._generate_response(scenario, topics, sentiment)
        
        # Check if feedback should be given (every 3 responses)
        should_give_feedback = (response_count + 1) % 3 == 0
        
        result = {
            "response": response,
            "should_give_feedback": should_give_feedback,
            "response_count": response_count + 1
        }
        
        if should_give_feedback:
            result["feedback"] = self._generate_feedback(user_message)
            result["fluency_tips"] = self._get_fluency_tips()
            result["vocabulary_suggestions"] = self._get_vocabulary_suggestions(topics)
        
        return result
    
    def _analyze_sentiment(self, doc) -> str:
        """Simple sentiment analysis"""
        positive_words = ["good", "great", "happy", "love", "excellent", "wonderful", "amazing"]
        negative_words = ["bad", "sad", "hate", "terrible", "awful", "poor", "wrong"]
        
        text_lower = doc.text.lower()
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "negative"
        return "neutral"
    
    def _extract_topics(self, doc) -> List[str]:
        """Extract main topics from text"""
        topics = []
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"]:
                topics.append(token.text.lower())
        return topics[:5]  # Return top 5 topics
    
    def _generate_response(self, scenario: str, topics: List[str], sentiment: str) -> str:
        """Generate a contextual response"""
        scenario_responses = {
            "restaurant": [
                "That's a great choice! Would you like something to drink with that?",
                "Our chef highly recommends the special today. Would you like to try it?",
                "Certainly! How would you like that prepared?",
                "That comes with your choice of sides. What would you prefer?"
            ],
            "interview": [
                "That's impressive experience. Can you tell me about a challenging project you've worked on?",
                "What skills do you think make you a good fit for this position?",
                "Where do you see yourself in five years?",
                "Do you have any questions about our company?"
            ],
            "travel": [
                "It's about 10 minutes walk from here. You'll see it on your left.",
                "You can take the bus number 42, it stops right outside.",
                "The museum is open until 6 PM. You have plenty of time!",
                "Yes, keep going straight and turn right at the traffic light."
            ],
            "shopping": [
                "This is on sale today! Would you like me to show you similar items?",
                "We have this in several colors. Which would you prefer?",
                "That's a popular choice. It's great quality too.",
                "Would you like me to gift wrap this for you?"
            ],
            "casual": [
                "That's really interesting! Tell me more about that.",
                "I completely understand what you mean.",
                "That sounds wonderful! How did you get into that?",
                "What do you enjoy most about it?"
            ]
        }
        
        responses = scenario_responses.get(scenario, scenario_responses["casual"])
        
        # Adjust based on sentiment
        if sentiment == "positive":
            prefix = random.choice(["Great! ", "Wonderful! ", "That's nice! ", ""])
        elif sentiment == "negative":
            prefix = random.choice(["I understand. ", "I see. ", "No worries. ", ""])
        else:
            prefix = ""
        
        return prefix + random.choice(responses)
    
    def _generate_feedback(self, user_message: str) -> str:
        """Generate feedback on user's language use"""
        feedback_templates = [
            "Great job expressing yourself! Your sentence structure is clear.",
            "Good vocabulary usage! Try incorporating more varied sentence types.",
            "You're making excellent progress! Consider using more connectors.",
            "Nice work! To improve fluency, try using more complex sentences."
        ]
        return random.choice(feedback_templates)
    
    def _get_fluency_tips(self) -> List[str]:
        """Get fluency improvement tips"""
        return [
            "Try to think in your target language rather than translating.",
            "Use filler words like 'well', 'so', 'actually' to sound more natural.",
            "Practice linking words together smoothly.",
            "Don't be afraid to make mistakes - they help you learn!"
        ]
    
    def _get_vocabulary_suggestions(self, topics: List[str]) -> List[str]:
        """Get vocabulary suggestions based on topics"""
        suggestions = []
        topic_vocab = {
            "food": ["delicious", "appetizing", "cuisine", "savory"],
            "work": ["professional", "collaborate", "deadline", "project"],
            "travel": ["journey", "destination", "explore", "adventure"],
            "weather": ["forecast", "temperature", "climate", "seasonal"]
        }
        
        for topic in topics:
            for key, words in topic_vocab.items():
                if key in topic.lower():
                    suggestions.extend(words)
        
        return suggestions[:4] if suggestions else ["enhance", "improve", "develop", "explore"]
    
    def get_scenarios(self) -> List[Dict]:
        """Get available conversation scenarios"""
        return [
            {
                "name": scenario["name"],
                "description": scenario["description"],
                "difficulty": self.level,
                "suggested_phrases": scenario["suggested_phrases"]
            }
            for scenario in self.SCENARIOS.values()
        ]
