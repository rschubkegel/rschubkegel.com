---
title: "KeepSafe.ai"
description: "Overview of KeepSafe.ai internal Silverpine project"
published: "2025-10-16"
author: "Rylan Schubkegel"
tags: ["silverpine", "keepsafe", "vue", "nuxt", "web", "ai"]
hidden: true
---

![KeepSafe.ai logo](https://keepsafe.ai/images/keepsafe-footer.svg)

---

KeepSafe.ai is an internal Silverpine project

AI-powered crisis detection
<!-- .element: class="fragment" -->

Mass notification system
<!-- .element: class="fragment" -->

Web app, mobile app, and API
<!-- .element: class="fragment" -->

---

![KeepSafe.ai dashboard](/images/slides/keepsafe/desktop-dashboard.png)

Note:
Users define assets that they want to monitor, such as a specific neighborhood or a specific business.

---

![KeepSafe.ai asset](/images/slides/keepsafe/desktop-asset.png)

Note:
- Detected events are displayed in a map
- Only events close to an asset trigger alerts
- Custom geometry is utilized for certain events (e.g. wildfires)

---

![KeepSafe.ai create notification](/images/slides/keepsafe/desktop-create-notification.png)

Note:
- Users can send mass notifications about an event
- Users can be notified individually or by group
- Notifications are sent via SMS, email, and/or push

---

![KeepSafe.ai notification](/images/slides/keepsafe/desktop-notification.png)

Note:
- Notification recipients can confirm receipt of the notification
- Notifiers can track contact responses

---

![KeepSafe.ai notification](/images/slides/keepsafe/desktop-notification-updated.png)

Note:
- Notifiers can update the notification status
- Notification recipients must re-confirm receipt
- Notifiers can resolve a notification

---

![KeepSafe.ai admin statistics](/images/slides/keepsafe/desktop-statistics.png)

Note:
- Various feeds (websites) provide sources (web pages)
- News articles, social media posts, and emergency feeds are all sources

---

![KeepSafe.ai agent processing graph](/images/slides/keepsafe/desktop-agent-config.png)

Note:
- News and social feeds require interpretation
- Websites are rendered, scraped, and processed by a chain of AI agents
- Sources must be marked as "active" and "dangerous" to qualify for event
- Events must be de-duplicated by a separate agent

---

![KeepSafe.ai agent processing graph](/images/slides/keepsafe/desktop-agent-graph.png)

Note:
- Sources may follow a different chain of agents depending on the LLM's "categorization" of the source

---

![Marketing site](/images/slides/keepsafe/marketing.png)

Note:
- New marketing site!

---

Thanks for listening!

# 🙏
