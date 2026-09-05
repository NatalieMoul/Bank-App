<?php

test('the application returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

test('user can register without password confirmation field', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Sopanha',
        'email' => 'sopanha@gmail.com',
        'phone' => '012345678',
        'address' => 'Phnom Penh, Cambodia',
        'password' => 'password',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('message', 'Registration successful');

    $this->assertDatabaseHas('users', [
        'email' => 'sopanha@gmail.com',
        'phone' => '012345678',
    ]);
});
