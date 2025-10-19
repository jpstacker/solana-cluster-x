Here’s a clean, non-technical README for your Anchor/Solana program. It focuses on concepts, user roles, and simple flows so anyone can understand how it works.

---

### Cluster X — Community Access and Membership on Solana

Cluster X is a simple, on-chain system for managing access to “instances” (think rooms, clubs, projects, or events) with clear roles and time-based passes. It lets a manager run the system, invite trusted admins, and empower paid “captains” to create time-limited portfolio spaces that members can join.

Program ID: D2s8xbXyKVEePW2KH8Kcn1wySnK2rzAd6eVb42WoYXHC

---

### Big Picture

- A single manager configures the app and sets limits.
- People can request to become admins with a short profile link.
- The manager can approve admins or reject requests.
- Anyone can become a captain (a creator role) and receive a limited number of creation slots.
- Captains can buy add-ons to get more creation capacity.
- Creators spin up “instances” that others can join, depending on the access type.
- Everything is transparent and secured on Solana.

---

### Core Ideas

- Manager: The owner who sets and updates system limits and permissions. There is only one manager key controlling the app.
- Admin: A trusted creator approved by the manager who can create special portfolio instances.
- Captain: A self-service creator who can claim a badge to create portfolio instances within a limit. Captains can expand with add-ons.
- Instance: A named space people can join. It can be public, invite-only, whitelisted, or time-bound (portfolio).
- Portfolio: A time-limited instance created by an admin or captain. It expires after a set number of days.

---

### Instance Types at a Glance

| Type        | Who can create                        | Who can join                              | Expiry               | Manager involvement              |
| ----------- | ------------------------------------- | ----------------------------------------- | -------------------- | -------------------------------- |
| Public      | Manager, Admin, Captain               | Anyone can claim                          | No                   | Optional                         |
| Private     | Manager only                          | No self-join; manager must grant access   | No                   | Required to grant access         |
| Whitelisted | Manager only                          | Only addresses on the whitelist can claim | No                   | Required to manage whitelist     |
| Portfolio   | Admin (active) or Captain (with slot) | Anyone can claim while it is not expired  | Yes (days-based TTL) | Not required once creators exist |

---

### What You Can Do

- Start the system: The manager creates the main config with a name, title, and limits for instances and add-ons.
- Request admin: Anyone submits a wallet + small profile link (URI). The manager can later approve or reject.
- Approve admin: The manager grants admin status to a wallet. Admins can create portfolio instances.
- Claim captainship: Anyone can claim a captain account to get a starting quota of portfolio creations.
- Buy add-ons: Captains can add more creation capacity, extending how many portfolio instances they can create.
- Create instances: Creators launch named instances with a type, participants, and optional whitelist.
- Claim an instance: Members join instances when the rules allow.

---

### How It Flows

- Set up

  - The manager initializes the app with a config.
  - The manager can later change limits and transfer manager rights.

- Become an admin

  - A user requests admin with a short URI (like a portfolio link).
  - The manager approves or rejects the request.
  - Approved admins can create portfolio instances.

- Become a captain

  - A user claims captainship to receive a starting creation limit.
  - Captains can buy add-ons to increase their creation capacity.

- Create an instance

  - Pick a type: Public, Private, Whitelisted, or Portfolio.
  - Give it a unique name and optional list of initial consumers and whitelist.
  - For portfolio instances, choose how many days it should last.

- Join an instance
  - Public: Anyone can claim to join.
  - Whitelisted: Only wallets on the list can join.
  - Portfolio: Anyone can join before it expires.
  - Private: Users cannot claim; the manager must grant them access.

---

### Limits and Rules That Matter

- Names

  - Project name: up to 20 characters.
  - Project title: up to 20 characters in practice.
  - Instance name: up to 30 characters, must be unique across the whole program.

- Lists

  - Consumers per instance: up to 200.
  - Whitelist per instance: up to 200.
  - Admin’s instance list: up to 200.
  - Captain’s instance list: up to 200.
  - Pending admin requests: up to 100.

- Portfolio expiry

  - Portfolio instances expire after the chosen number of days.
  - Once expired, new users cannot join.

- Captain limits
  - Captains have a “remaining_limit” that decreases when creating portfolio instances.
  - Buying an add-on increases this limit by a configured amount.

---

### Roles and Powers

- Manager

  - Initialize and configure the system.
  - Approve or reject admin requests.
  - Grant access to Private instances.
  - Add addresses to whitelists.
  - Update limits or hand over manager role.

- Admin

  - Create portfolio instances while active.

- Captain

  - Create portfolio instances if they have remaining capacity.
  - Buy add-ons to increase capacity.

- Member
  - Join instances if allowed by the type and rules.

---

### Instance Creation and Joining Rules

- Public

  - Created by manager/admin/captain.
  - Everyone can join.

- Private

  - Created by manager.
  - Only the manager can add people; claiming is not allowed.

- Whitelisted

  - Created by manager.
  - Only listed addresses can claim to join.

- Portfolio
  - Created by active admin or a captain with remaining capacity.
  - Anyone can claim to join before it expires.
  - Each portfolio creation reduces a captain’s remaining capacity by one.

---

### Names and Uniqueness

- Each instance is identified by its name on-chain.
- Names are global in this program, so two instances cannot share the same name.
- Choose short, memorable, and unique names up to 30 characters.

---

### Data, Safety, and Fairness

- Transparency

  - All roles, instances, and joins are recorded on-chain for open auditing.

- Safety checks

  - Strict limits prevent oversized lists.
  - Time calculations use careful checks to avoid errors.
  - Duplicate joins are prevented.

- Ownership
  - The manager key is the single source of truth for global control.
  - Admin and captain accounts are tied to wallet addresses.

---

### Known Limitations and Quirks

- _`Admin approvals and the request queue`_ - The approve flow is currently restricted and expects the pending requests list to be empty at approval time. In practice, this means the manager may need to clear or avoid piling requests before approving.

- _`Private instances`_ - Users cannot self-join Private instances. The manager must grant access directly.

- _`Add-on data`_ - An AddOn account is created when buying add-ons for bookkeeping, but the capacity increase is tracked primarily on the captain account.

- _`Title length`_ - Although the title field can store more, the setup currently enforces a practical limit of 20 characters.

- _`Global names`_ - Instance names are unique across the entire program, not just within a single community.

---

### Plain-English Glossary

- _`Config`_ - The master settings of the app and who the manager is.
- _`Admin Request`_ - A queue of people who asked to become admins, with a short link to their profile or portfolio.
- _`Admin Account`_ - A record that someone is an active admin and which instances they created.
- _`Captain Account`_ - A record that someone can create portfolio instances and how many creations they have left.
- _`AddOn`_ - A purchased expansion that increases a captain’s creation capacity.
- _`Instance`_ - A named space with an access type and lists of who can join or has joined.

---

### Practical Examples

- _`An open club`_ - Create a Public instance named “OpenClub”. Anyone can join at any time.

- _`An invite-only room`_ - Create a Private instance named “CoreTeam”. The manager grants access directly to specific wallets.

- _`A VIP list`_ - Create a Whitelisted instance named “VIPLounge”. Only listed addresses can claim access.

- _`A time-boxed portfolio`_ - An Admin or Captain creates “AutumnShowcase” for 14 days. People can join during the 14-day window only.

---
