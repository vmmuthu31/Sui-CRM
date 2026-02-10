module sui_crm::org {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::transfer;

    struct Org has key, store {
        id: UID,
        name: String,
        admin: address,
    }

    public fun create_org(name: String, ctx: &mut TxContext) {
        let org = Org {
            id: object::new(ctx),
            name,
            admin: tx_context::sender(ctx),
        };
        transfer::transfer(org, tx_context::sender(ctx));
    }
}
