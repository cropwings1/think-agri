"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  Users,
  ExternalLink,
  Info,
  UserRoundPlus,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { languages, type Language } from "@/lib/content";

type Interest = {
  id: string;
  slug: string;
  name_en: string;
  name_te?: string | null;
  name_kn?: string | null;
  name_hi?: string | null;
  description_en?: string | null;
  description_te?: string | null;
  description_kn?: string | null;
  description_hi?: string | null;
};
const visual: Record<string, { icon: string; color: string }> = {
  crops: { icon: "🌾", color: "sage" },
  dairy: { icon: "🐄", color: "butter" },
  livestock: { icon: "🐐", color: "lilac" },
  poultry: { icon: "🐓", color: "peach" },
  fisheries: { icon: "🐟", color: "blue" },
  "agri-schemes": { icon: "🌱", color: "sage" },
};
type SuccessContent = Record<string, string>;
type FieldErrors = {
  name: string;
  phone: string;
  pincode: string;
  consent: string;
  interests: string;
};
const emptyErrors: FieldErrors = {
  name: "",
  phone: "",
  pincode: "",
  consent: "",
  interests: "",
};
export default function Home() {
  const [step, setStep] = useState<1 | 2>(1);
  const locale = useLocale() as Language;
  const router = useRouter();
  const languageT = useTranslations("language"),
    interestsT = useTranslations("interests"),
    detailsT = useTranslations("details"),
    validationT = useTranslations("validation"),
    communitiesT = useTranslations("communities");
  const [interests, setInterests] = useState<Interest[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string[]>([]),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [pincode, setPincode] = useState(""),
    [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors),
    [attempted, setAttempted] = useState(false),
    [serverError, setServerError] = useState(""),
    [busy, setBusy] = useState(false),
    [farmerCode, setFarmerCode] = useState("");
  const [successContent, setSuccessContent] = useState<Record<string, string>>(
    {}
  );
  const [successContentLoading, setSuccessContentLoading] = useState(false);
  const [successContentError, setSuccessContentError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/interests", { cache: "no-store" })
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok || !b.success)
          throw new Error(b.error?.message || "Unable to load interests");
        return b.data as Interest[];
      })
      .then((data) => {
        if (active) setInterests(data);
      })
      .catch((e) => {
        if (active)
          setLoadError(
            e instanceof Error ? e.message : "Unable to load interests"
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (step !== 2) return;
    let active = true;
    setSuccessContentLoading(true);
    setSuccessContentError("");
    fetch(`/api/content/registration_success?language=${locale}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success)
          throw new Error(
            body.error?.message || "Unable to load confirmation content"
          );
        return body.data?.content as SuccessContent;
      })
      .then((content) => {
        if (active) setSuccessContent(content || {});
      })
      .catch((error) => {
        if (active)
          setSuccessContentError(
            error instanceof Error
              ? error.message
              : "Unable to load confirmation content"
          );
      })
      .finally(() => {
        if (active) setSuccessContentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [step, locale]);

  function chooseLanguage(id: Language) {
    document.cookie = `NEXT_LOCALE=${id}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }
  function validateName(v: string) {
    const n = v.trim().replace(/\s+/g, " ");
    if (!n) return validationT("nameRequired");
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u.test(n))
      return validationT("nameInvalid");
    return "";
  }
  function validatePhone(v: string) {
    const d = v.replace(/\D/g, "");
    if (!d) return validationT("phoneRequired");
    if (!/^[6-9]\d{9}$/.test(d)) return validationT("phoneInvalid");
    return "";
  }
  function validatePin(v: string) {
    const p = v.trim();
    if (!p) return validationT("pincodeRequired");
    if (!/^[1-9]\d{5}$/.test(p)) return validationT("invalidPincode");
    return "";
  }
  function validateAll() {
    const e = {
      name: validateName(name),
      phone: validatePhone(phone),
      pincode: validatePin(pincode),
      consent: consent ? "" : validationT("consentRequired"),
      interests: selected.length ? "" : validationT("interestsRequired"),
    };
    setFieldErrors(e);
    return Object.values(e).every((x) => !x);
  }
  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    if (attempted)
      setFieldErrors((old) => ({
        ...old,
        interests: next.length ? "" : validationT("interestsRequired"),
      }));
  }
  async function submit() {
    setAttempted(true);
    setServerError("");
    if (!validateAll()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `+91${phone}`,
          pincode: pincode.trim(),
          language: locale,
          interests: selected,
          consent: true,
          consent_text_version: "v1",
          source: "farmer-community-website",
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.success)
        throw new Error(
          body.error?.message || body.error || validationT("required")
        );
      setFarmerCode(body.data?.farmerCode || "");
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : validationT("required"));
    } finally {
      setBusy(false);
    }
  }
  function edit() {
    setStep(1);
    setServerError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <main className="language-gate flow-gate two-step-gate">
      <section
        className="language-panel flow-panel two-step-panel"
        aria-labelledby="step-title"
      >
        <div className="two-step-progress" aria-label={`Step ${step} of 2`}>
          <span className={step === 1 ? "active" : "complete"}>
            {step === 1 ? "1" : <Check size={15} />}
          </span>
          <i className={step === 2 ? "complete-line" : ""} />
          <span className={step === 2 ? "active" : "upcoming"}>2</span>
        </div>
        {step === 1 && (
          <div className="step-content clean-step combined-step">
            <div className="language-choice-block">
              <div
                className="first-screen-language-list"
                aria-label={languageT("title")}
              >
                {languages.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    className={`first-screen-language ${
                      locale === x.id ? "is-selected" : ""
                    }`}
                    onClick={() => chooseLanguage(x.id)}
                    aria-pressed={locale === x.id}
                  >
                    <span>{x.native}</span>
                  </button>
                ))}
              </div>
            </div>
            <h1 id="step-title">{detailsT("title")}</h1>
            <p className="clean-description">{detailsT("help")}</p>
            <div className="combined-details-grid">
              <label className="field">
                <span>
                  {detailsT("fullName")} <i>*</i>
                </span>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (attempted)
                      setFieldErrors((o) => ({
                        ...o,
                        name: validateName(e.target.value),
                      }));
                  }}
                  onBlur={() =>
                    attempted &&
                    setFieldErrors((o) => ({ ...o, name: validateName(name) }))
                  }
                  placeholder={detailsT("namePlaceholder")}
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && (
                  <small className="form-error">{fieldErrors.name}</small>
                )}
              </label>
              <label className="field">
                <span>
                  {detailsT("phone")} <i>*</i>
                </span>
                <div className="phone-input">
                  <span>+91</span>
                  <input
                    value={phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(v);
                      if (attempted)
                        setFieldErrors((o) => ({
                          ...o,
                          phone: validatePhone(v),
                        }));
                    }}
                    onBlur={() =>
                      attempted &&
                      setFieldErrors((o) => ({
                        ...o,
                        phone: validatePhone(phone),
                      }))
                    }
                    maxLength={10}
                    placeholder="98765 43210"
                    inputMode="numeric"
                    autoComplete="tel-national"
                  />
                </div>
                {fieldErrors.phone && (
                  <small className="form-error">{fieldErrors.phone}</small>
                )}
              </label>
              <label className="field">
                <span>
                  {detailsT("pincode")} <i>*</i>
                </span>
                <input
                  value={pincode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(v);
                    if (attempted)
                      setFieldErrors((o) => ({
                        ...o,
                        pincode: validatePin(v),
                      }));
                  }}
                  onBlur={() =>
                    attempted &&
                    setFieldErrors((o) => ({
                      ...o,
                      pincode: validatePin(pincode),
                    }))
                  }
                  placeholder={detailsT("pincodePlaceholder")}
                  inputMode="numeric"
                  maxLength={6}
                />
                {fieldErrors.pincode && (
                  <small className="form-error">{fieldErrors.pincode}</small>
                )}
              </label>
            </div>
            <div className="combined-interests-heading">
              <h2>{interestsT("title")}</h2>
              <p>{interestsT("help")}</p>
            </div>
            <div className="category-grid clean-category-grid combined-category-grid">
              {loading && <p>{detailsT("pleaseWait")}</p>}
              {loadError && (
                <p className="form-error" role="alert">
                  {loadError}
                </p>
              )}
              {!loading &&
                !loadError &&
                interests.map((item) => {
                  const active = selected.includes(item.id),
                    v = visual[item.slug] || { icon: "🌱", color: "sage" };
                  const label = (item as any)[`name_${locale}`] || item.name_en;
                  const desc =
                    (item as any)[`description_${locale}`] ||
                    item.description_en ||
                    "";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`category-card ${v.color} ${
                        active ? "is-selected" : ""
                      }`}
                      onClick={() => toggle(item.id)}
                      aria-pressed={active}
                    >
                      <span className="category-emoji">{v.icon}</span>
                      <span className="category-copy">
                        <b>{label}</b>
                        <small>{desc}</small>
                      </span>
                      <span className="category-check">
                        {active && <Check size={14} />}
                      </span>
                    </button>
                  );
                })}
            </div>
            {fieldErrors.interests && (
              <p className="form-error" role="alert">
                {fieldErrors.interests}
              </p>
            )}
            <label className="consent-row combined-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (attempted)
                    setFieldErrors((o) => ({
                      ...o,
                      consent: e.target.checked
                        ? ""
                        : validationT("consentRequired"),
                    }));
                }}
              />
              <span>{detailsT("consent")}</span>
            </label>
            {fieldErrors.consent && (
              <p className="form-error">{fieldErrors.consent}</p>
            )}
            {serverError && (
              <p className="form-error" role="alert">
                {serverError}
              </p>
            )}
            <button
              className="wa-continue combined-continue"
              type="button"
              onClick={submit}
              disabled={
                busy || loading || !!loadError || interests.length === 0
              }
            >
              {busy ? detailsT("pleaseWait") : detailsT("submit")}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="step-content clean-step community-success">
            <h1 id="step-title">
              {successContent.success_title || communitiesT("title")}
            </h1>
            <p className="clean-description">
              {farmerCode
                ? `${
                    successContent.success_message ||
                    "Registration successful. Your farmer ID is"
                  } ${farmerCode}.`
                : successContent.complete_message ||
                  "Your registration is complete."}
            </p>
            {successContentLoading && (
              <p className="community-content-loading">
                Loading community information…
              </p>
            )}
            {successContentError && (
              <p className="form-error" role="alert">
                {successContentError}
              </p>
            )}
            <div className="community-join-layout">
              <div className="community-illustration">
                <Image
                  src="/images/farmer-whatsapp-community.webp"
                  alt="Farmer joining a WhatsApp community"
                  width={640}
                  height={640}
                  priority
                  sizes="(max-width: 760px) 80vw, 360px"
                />
              </div>
              <section
                className="community-join-card"
                aria-label={
                  successContent.community_heading || "Farmer Community"
                }
              >
                <div className="community-join-heading">
                  <span className="community-join-icon">
                    <Users size={27} />
                  </span>
                  <div>
                    <h2>
                      {successContent.community_heading ||
                        "Join our Farmer Community"}
                    </h2>
                    <p>
                      {successContent.community_subheading ||
                        "Connect with farmers on WhatsApp."}
                    </p>
                  </div>
                </div>
                <a
                  className="community-join-button"
                  href={
                    successContent.community_invite_url ||
                    "https://chat.whatsapp.com/Fv9I1VKf8K1KS9X6aEAsMK"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={23} />
                  <span>
                    {successContent.community_button || "Join Farmer Community"}
                  </span>
                  <ExternalLink size={19} />
                </a>
                <div className="community-info-note">
                  <span className="community-info-icon">
                    <Info size={21} />
                  </span>
                  <div>
                    <strong>
                      {successContent.instruction_heading ||
                        "What happens after you join?"}
                    </strong>
                    <p>
                      {successContent.instruction_message ||
                        "After joining, our team will add you to the relevant WhatsApp groups based on your selected interests."}
                    </p>
                  </div>
                </div>
              </section>
            </div>
            <section
              className="community-next-steps"
              aria-label={
                successContent.next_steps_heading || "What happens next?"
              }
            >
              <div className="community-next-title">
                <strong>
                  {successContent.next_steps_heading || "What happens next?"}
                </strong>
              </div>
              <div className="community-next-item">
                <span>
                  <MessageCircle size={23} />
                </span>
                <p>{successContent.next_step_1 || "Join the community"}</p>
              </div>
              <ArrowRight className="community-next-arrow" size={21} />
              <div className="community-next-item">
                <span>
                  <UserRoundPlus size={23} />
                </span>
                <p>
                  {successContent.next_step_2 ||
                    "Our team will add you to the relevant groups"}
                </p>
              </div>
              <ArrowRight className="community-next-arrow" size={21} />
              <div className="community-next-item">
                <span>
                  <Bell size={23} />
                </span>
                <p>
                  {successContent.next_step_3 ||
                    "You will receive group updates on WhatsApp"}
                </p>
              </div>
            </section>
            <button
              className="clean-back clean-edit community-edit"
              type="button"
              onClick={edit}
            >
              <ArrowLeft size={18} />
              {successContent.edit_details || communitiesT("edit")}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
