<script lang="ts">
export const meta = {
	title: 'Destructible',
	icon: 'tabler:trash',
	summary: 'Lets an object be removed from the game.',
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSection id="content-1">
		<p>Adds the ability to remove an object from the game for good. Once destroyed, an object is no longer drawn and can't be shown again.</p>

		<p>Destroying an object does not clear any variables that refer to it, or remove it from any arrays it belongs to. You'll have to do that yourself. To clear a variable, set it to <code>null</code>.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="isDestroyed" type="boolean">Whether this object has been destroyed.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="destroy(): void">Remove this object from the game. Does not clear any variables it is assigned to or remove it from any arrays it belongs to.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>let coin = new Sprite({ src: 'coin.png' })

coin.onClick(() =&gt; {
    coin.destroy()
    coin = null
})</pre>
	</DocSnippet>
</template>
