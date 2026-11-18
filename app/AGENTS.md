# Profile app guidance

## ATProto requirements

Separate domain control and the chosen NSID from network Lexicon publication.
ATProto recommends publishing Lexicons on the network; it does not require that
step for every application record. This app bundles its schema for validation.
Verify the actual PDS write/read behavior before claiming interoperability.

Do not make a new schema-hosting account, network schema record or authority
TXT record a launch prerequisite without a concrete protocol, provider or
product requirement. If network publication is chosen, get approval for the
separate account/DNS writes. A static JSON schema is not network publication.

Source: https://atproto.com/guides/publishing-lexicons

## OAuth lifecycle

The pinned SDK cleans up an old session during a successful OAuth callback,
then stores and announces its replacement. Do not treat that cleanup event as
revocation of the newly returned login. Track the affected account and event
order; genuine later deletion and explicit sign-out must still invalidate it.
Keep a regression using the pinned SDK's actual callback with synthetic stores,
not just an authentication mock that immediately returns a session.
