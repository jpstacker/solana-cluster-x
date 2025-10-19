Here’s a clean, non-technical README for your Anchor/Solana program. It focuses on concepts, user roles, and simple flows so anyone can understand how it works.

---

### _Cluster X_ — Community Access and Membership on Solana

_`Cluster X`_ is a simple, on-chain system for managing access to “instances” (think rooms, clubs, projects, or events) with clear roles and time-based passes. It lets a manager run the system, invite trusted admins, and empower paid “captains” to create time-limited portfolio spaces that members can join.

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

- _`Manager`_ - The owner who sets and updates system limits and permissions. There is only one manager key controlling the app.
- _`Admin`_ - A trusted creator approved by the manager who can create special portfolio instances.
- _`Captain`_ - A self-service creator who can claim a badge to create portfolio instances within a limit. Captains can expand with add-ons.
- _`Instance`_ - A named space people can join. It can be public, invite-only, whitelisted, or time-bound (portfolio).
- _`Portfolio`_ - A time-limited instance created by an admin or captain. It expires after a set number of days.

---

### Instance Types at a Glance

| Type            | Who can create                        | Who can join                              | Expiry               | Manager involvement              |
| --------------- | ------------------------------------- | ----------------------------------------- | -------------------- | -------------------------------- |
| _`Public`_      | Manager, Admin, Captain               | Anyone can claim                          | No                   | Optional                         |
| _`Private`_     | Manager only                          | No self-join; manager must grant access   | No                   | Required to grant access         |
| _`Whitelisted`_ | Manager only                          | Only addresses on the whitelist can claim | No                   | Required to manage whitelist     |
| _`Portfolio`_   | Admin (active) or Captain (with slot) | Anyone can claim while it is not expired  | Yes (days-based TTL) | Not required once creators exist |

---

### What You Can Do

- _`Start the system`_ - The manager creates the main config with a name, title, and limits for instances and add-ons.
- _`Request admin`_ - Anyone submits a wallet + small profile link (URI). The manager can later approve or reject.
- _`Approve admin`_ - The manager grants admin status to a wallet. Admins can create portfolio instances.
- _`Claim captainship`_ - Anyone can claim a captain account to get a starting quota of portfolio creations.
- _`Buy add-ons`_ - Captains can add more creation capacity, extending how many portfolio instances they can create.
- _`Create instances`_ - Creators launch named instances with a type, participants, and optional whitelist.
- _`Claim an instance`_ - Members join instances when the rules allow.

---

### How It Flows

- _`Set up`_ - The manager initializes the app with a config and later change limits and transfer manager rights.

- _`Become an admin`_

  - A user requests admin with a short URI (like a portfolio link).
  - The manager approves or rejects the request.
  - Approved admins can create portfolio instances.

- _`Become a captain`_

  - A user claims captainship to receive a starting creation limit.
  - Captains can buy add-ons to increase their creation capacity.

- _`Create an instance`_

  - Pick a type: Public, Private, Whitelisted, or Portfolio.
  - Give it a unique name and optional list of initial consumers and whitelist.
  - For portfolio instances, choose how many days it should last.

- _`Join an instance`_
  - Public: Anyone can claim to join.
  - Whitelisted: Only wallets on the list can join.
  - Portfolio: Anyone can join before it expires.
  - Private: Users cannot claim; the manager must grant them access.

---

### Limits and Rules That Matter

- _`Names`_

  - Project name: up to 20 characters.
  - Project title: up to 20 characters in practice.
  - Instance name: up to 30 characters, must be unique across the whole program.

- _`Lists`_

  - Consumers per instance: up to 200.
  - Whitelist per instance: up to 200.
  - Admin’s instance list: up to 200.
  - Captain’s instance list: up to 200.
  - Pending admin requests: up to 100.

- _`Portfolio expiry`_

  - Portfolio instances expire after the chosen number of days.
  - Once expired, new users cannot join.

- _`Captain limits`_
  - Captains have a “remaining_limit” that decreases when creating portfolio instances.
  - Buying an add-on increases this limit by a configured amount.

---

### Roles and Powers

- _`Manager`_

  - Initialize and configure the system.
  - Approve or reject admin requests.
  - Grant access to Private instances.
  - Add addresses to whitelists.
  - Update limits or hand over manager role.

- _`Admin`_ - Create portfolio instances while active.

- _`Captain`_

  - Create portfolio instances if they have remaining capacity.
  - Buy add-ons to increase capacity.

- _`Member`_
  - Join instances if allowed by the type and rules.

---

### Instance Creation and Joining Rules

- _`Public`_

  - Created by manager/admin/captain.
  - Everyone can join.

- _`Private`_

  - Created by manager.
  - Only the manager can add people; claiming is not allowed.

- _`Whitelisted`_

  - Created by manager.
  - Only listed addresses can claim to join.

- _`Portfolio`_
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

- _`Transparency`_

  - All roles, instances, and joins are recorded on-chain for open auditing.

- _`Safety checks`_

  - Strict limits prevent oversized lists.
  - Time calculations use careful checks to avoid errors.
  - Duplicate joins are prevented.

- _`Ownership`_
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
