<?php

namespace App\Policies;

use App\Models\Card;
use App\Models\User;

class CardPolicy
{
    public function view(User $user, Card $card): bool
    {
        return (int) $card->account->user_id === (int) $user->id;
    }

    public function update(User $user, Card $card): bool
    {
        return $this->view($user, $card);
    }

    public function delete(User $user, Card $card): bool
    {
        return $this->view($user, $card);
    }

    public function create(User $user): bool
    {
        return $user->isCustomer() || $user->isAdmin();
    }
}
