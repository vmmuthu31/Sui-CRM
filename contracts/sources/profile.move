module sui_crm::profile {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::transfer;

    struct Profile has key, store {
        id: UID,
        username: String,
        owner: address,
    }

    public fun create_profile(username: String, ctx: &mut TxContext) {
        let profile = Profile {
            id: object::new(ctx),
            username,
            owner: tx_context::sender(ctx),
        };
        transfer::transfer(profile, tx_context::sender(ctx));
    }
}
