<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Login/Register</h1>
<form
	class="flex flex-col items-center justify-center gap-x-5 gap-y-5"
	method="post"
	action="?/login"
	use:enhance
>
	<label>
		Username
		<input class="rounded-md border border-rose-500 p-1" name="username" />
	</label>
	<label>
		Password
		<input type="password" class="rounded-md border border-rose-500 p-1" name="password" />
	</label>
	<div class="flex gap-x-3">
		<button class="rounded-md border border-rose-300 p-1">Login</button>
		<button class="rounded-md border border-rose-300 p-1" formaction="?/register">Register</button>
		<a href="/demo/lucia/login/google">Sign in with Google</a>
		<a href="/demo/lucia/login/github">Sign in with GitHub</a>
		<!-- /demo/lucia -->
	</div>
</form>
<p style="color: red">{form?.message ?? ''}</p>
