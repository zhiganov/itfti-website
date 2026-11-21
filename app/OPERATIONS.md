# Takedowns and hidden profiles

## Who handles requests

The Citizen Infra maintainer reads hello@citizeninfra.org and decides takedown
requests for app.itfti.org. They reply to the sender within 5 working days.

## What can be done

The host can hide a profile on app.itfti.org. It can't change or delete the
record in the person's account. Only the account owner can do that. Copies
elsewhere stay where they are.

## Steps

1. Confirm the request names a profile URL. Ask for it if not.
2. Read the public profile and any linked report. Don't ask for private evidence.
3. Decide:
   - **Hide** if the profile breaks the [Code of Conduct](CODE_OF_CONDUCT.md),
     exposes someone's private details or impersonates someone. Also hide it if
     the account owner asks and can't unpublish themselves.
   - **Leave it up** if the complaint is a disagreement about the author's
     claims. Point the sender to the author, since ItFtI doesn't certify claims.
4. To hide: add the profile's DID to `src/moderation.js`, merge, and check that
   the profile page reads "This profile is unavailable on ItFtI" after deploy.
5. Tell the sender, and the account owner where appropriate, what was done.
6. Keep the request and decision in the inbox. Don't put the sender's details
   or reasons in the repo or an issue.

## Undoing a hide

Remove the DID from `src/moderation.js`, merge and check the page again.

## Limits

The hidden list is in a public repo, so anyone can see which profile IDs are
hidden. The commit message shouldn't say why.

For abuse in the account itself, also report it to the account's host, for
example through Bluesky's reporting tools.
