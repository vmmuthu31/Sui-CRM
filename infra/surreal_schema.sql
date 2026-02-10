-- Define schemas for SurrealDB

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD username ON TABLE user TYPE string;
DEFINE FIELD wallet_address ON TABLE user TYPE string;
DEFINE FIELD created_at ON TABLE user TYPE datetime DEFAULT time::now();
DEFINE INDEX wallet_address ON TABLE user COLUMNS wallet_address UNIQUE;

DEFINE TABLE interaction_log SCHEMAFULL;
DEFINE FIELD user ON TABLE interaction_log TYPE record<user>;
DEFINE FIELD action ON TABLE interaction_log TYPE string;
DEFINE FIELD timestamp ON TABLE interaction_log TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE interaction_log TYPE object;

DEFINE TABLE campaign SCHEMAFULL;
DEFINE FIELD name ON TABLE campaign TYPE string;
DEFINE FIELD description ON TABLE campaign TYPE string;
DEFINE FIELD created_at ON TABLE campaign TYPE datetime DEFAULT time::now();

DEFINE TABLE campaign_participation SCHEMAFULL;
DEFINE FIELD campaign ON TABLE campaign_participation TYPE record<campaign>;
DEFINE FIELD user ON TABLE campaign_participation TYPE record<user>;
DEFINE FIELD status ON TABLE campaign_participation TYPE string;
DEFINE FIELD joined_at ON TABLE campaign_participation TYPE datetime DEFAULT time::now();
