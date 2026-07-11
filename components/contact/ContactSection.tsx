"use client";

import React, { useState } from "react";
import {
  Bug,
  Headphones,
  MessageSquareText,
  Mail,
  Send,
  User,
  Tag,
  PenLine,
} from "lucide-react";
import styles from "./ContactSection.module.css";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section id="Contact" className={styles.contactSection}>
      {/* Top Section Divider */}
      <div className={styles.sectionDivider}></div>

      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={styles.radialGradient}></div>
      </div>

      <div className={styles.container}>
        {/* Left Section - 52% */}
        <div className={styles.leftSection}>
          <div className={styles.labelWrapper}>
            <span className={styles.label}>CONTACT US</span>
            <div className={styles.horizontalDivider}>
              <div className={styles.dot}></div>
            </div>
          </div>

          <h2 className={styles.heading}>
            <span className={styles.headingWhite}>
              Hyper Learning is here to
            </span>
            <br />
            <span className={styles.headingGold}>help you today.</span>
          </h2>

          <p className={styles.description}>
            Have a question, found a bug, or need support?
            <br />
            Let us know — we&apos;ll get back to you as soon as possible.
          </p>

          <div className={styles.featuresHorizontal}>
            {/* Feature 1 */}
            <div className={styles.featureItem}>
              <div className={styles.iconWrapper}>
                <Bug size={24} strokeWidth={2} />
              </div>
              <div className={styles.featureText}>
                <h3 className={styles.featureTitle}>Report Issues</h3>
                <p className={styles.featureDesc}>Help us improve</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureItem}>
              <div className={styles.iconWrapper}>
                <Headphones size={24} strokeWidth={2} />
              </div>
              <div className={styles.featureText}>
                <h3 className={styles.featureTitle}>Get Support</h3>
                <p className={styles.featureDesc}>We&apos;re here to help</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureItem}>
              <div className={styles.iconWrapper}>
                <MessageSquareText size={24} strokeWidth={2} />
              </div>
              <div className={styles.featureText}>
                <h3 className={styles.featureTitle}>Share Feedback</h3>
                <p className={styles.featureDesc}>Your feedback matters</p>
              </div>
            </div>
          </div>

          <div className={styles.availabilityBadge}>
            <div className={styles.availabilityDot}></div>
            <span className={styles.availabilityText}>
              Usually replies within 12 hours
            </span>
          </div>
        </div>

        {/* Center Vertical Divider */}
        <div className={styles.centerDivider}>
          <div className={styles.centerDot}></div>
        </div>

        {/* Right Section - 50% */}
        <div className={styles.rightSection}>
          <div className={styles.contactCard}>
            {/* Corner Glow */}
            <div className={styles.cardGlowTopRight}></div>

            <div className={styles.heroIconWrapper}>
              {/* Continuous Signal Rings */}
              <div
                className={styles.signalRing}
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className={styles.signalRing}
                style={{ animationDelay: "1.5s" }}
              ></div>
              <div
                className={styles.signalRing}
                style={{ animationDelay: "3s" }}
              ></div>

              <div className={styles.mailIconCircle}>
                <Mail className={styles.heroIcon} size={22} strokeWidth={1.5} />
              </div>
              <div className={styles.floatingDot1}></div>
              <div className={styles.floatingDot2}></div>
              <div className={styles.floatingDot3}></div>
            </div>

            <h3 className={styles.cardHeading}>Send us a message</h3>
            <p className={styles.cardSubtitle}>
              We&apos;ll respond as soon as possible.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name" className="sr-only">
                    Your name
                  </label>
                  <div className={styles.inputIconWrapper}>
                    <User
                      className={styles.inputIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={styles.input}
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="email" className="sr-only">
                    Your email
                  </label>
                  <div className={styles.inputIconWrapper}>
                    <Mail
                      className={styles.inputIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={styles.input}
                    placeholder="Your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="subject" className="sr-only">
                  Subject
                </label>
                <div className={styles.inputIconWrapper}>
                  <Tag
                    className={styles.inputIcon}
                    size={16}
                    strokeWidth={1.5}
                  />
                </div>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className={styles.input}
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.messageGroup}`}>
                <label htmlFor="message" className="sr-only">
                  Your message
                </label>
                <div className={styles.inputIconWrapper}>
                  <PenLine
                    className={styles.inputIcon}
                    size={16}
                    strokeWidth={1.5}
                  />
                </div>
                <textarea
                  id="message"
                  name="message"
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Your message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className={styles.submitRow}>
                <button type="submit" className={styles.submitBtn}>
                  <span className={styles.submitText}>Send Message</span>
                  <Send className={styles.btnIcon} size={16} strokeWidth={2} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
