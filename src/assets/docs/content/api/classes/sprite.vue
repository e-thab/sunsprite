<script lang="ts">
export const meta = {
	title: 'Sprite',
	icon: 'tabler:photo',
	summary: 'An image-based game object.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Sprite(options?: SpriteProps)</pre></DocSnippet>
	
	<DocSection id="content-1">
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque quis finibus felis. Duis vestibulum aliquam suscipit. Curabitur elementum egestas lacinia. Nam rhoncus velit nisi. Nulla et augue tristique odio blandit convallis. Integer rutrum ornare malesuada. Sed vehicula rutrum consectetur.</p>

		<p>In mattis massa in accumsan consequat. Aenean pretium sapien tortor, quis hendrerit eros fringilla et. Ut in augue libero. Vivamus sit amet lobortis augue, sit amet auctor elit. Aliquam massa arcu, euismod at pharetra aliquet, congue aliquet eros. Pellentesque ut malesuada sapien, eget ultrices tortor. Morbi posuere elementum ligula eu ornare.</p>
	
		<p>Sed lobortis libero in nisi semper porttitor. Fusce vestibulum urna sem, sed mollis lorem finibus ultrices. Fusce in blandit lacus. Maecenas eu porta dui. Vivamus eu blandit odio, eu scelerisque neque. Fusce pellentesque semper ligula et convallis. Nunc fermentum nunc vitae nisi tristique, non imperdiet ligula viverra. Nulla facilisis erat dignissim est egestas, ut dapibus quam pretium.</p>
	
		<p>Donec tempus, magna sit amet fringilla accumsan, ante diam vestibulum libero, a fermentum tortor purus ac urna. Vivamus commodo mollis nibh eget maximus. Fusce viverra massa ut orci blandit, a ornare nulla varius. Aenean vehicula facilisis interdum. In quam massa, vestibulum vel finibus ac, lobortis non nisl. Maecenas imperdiet arcu purus, a consequat justo tempus quis. Morbi tincidunt lacinia justo eget fermentum. Pellentesque non aliquam libero.</p>
	
		<p>Sed elementum auctor efficitur. Cras pharetra, sem ultricies suscipit condimentum, ligula ligula egestas leo, vitae feugiat urna neque ac urna. Aenean sodales dolor arcu, non auctor libero posuere non. Curabitur auctor laoreet risus non cursus. Donec mi mi, vulputate quis felis a, pulvinar convallis tortor. Vivamus id porttitor lorem, a congue metus. Integer varius nisl id velit elementum, a placerat lacus condimentum. Sed quis mi velit. Vestibulum blandit mattis lectus vitae aliquet. Morbi tincidunt vehicula lacinia.</p>
	
		<p>Donec eleifend elit nec libero ultrices fermentum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla mollis diam quis nibh faucibus blandit. Nunc fringilla ullamcorper ultricies. Aliquam ornare sed urna imperdiet hendrerit. Duis sit amet nisi elementum, egestas quam a, lobortis libero. Pellentesque vestibulum pulvinar semper. Sed ac tincidunt felis. Nullam efficitur nibh a mattis hendrerit. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi interdum interdum quam at imperdiet. Quisque a convallis nibh, eu varius ligula.</p>
	
		<p>Pellentesque gravida lorem sed tempor accumsan. In finibus mi non semper egestas. Aliquam cursus nibh vel purus pharetra pulvinar. Vestibulum at erat accumsan, pretium sapien vitae, imperdiet elit. Sed mollis turpis ut risus suscipit, vel mollis mauris lobortis. Suspendisse luctus at mauris a commodo. Ut tempus blandit orci. Donec ac ante ante.</p>
	
		<p>Cras vulputate risus at euismod ultricies. Fusce porta tincidunt feugiat. Nam condimentum ornare interdum. Aliquam id magna sit amet nisi bibendum convallis. Sed convallis, enim et ullamcorper posuere, diam quam semper nisl, at vestibulum tortor felis sed diam. Praesent interdum fringilla velit ut feugiat. Suspendisse velit nisl, placerat eu justo vel, volutpat porttitor tellus. Duis faucibus sapien nec posuere molestie. Morbi ut sapien arcu. Pellentesque ac libero velit. Vestibulum eget interdum arcu. Aenean eget lacus.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="SpriteProps" optional>Initial properties: any GameObject property (x, y, width, height, scale, rotation, alpha, layer, visible, draggable, cursor, mouse event handlers) plus src.</DocParam>
	</DocParams>

	<DocProperties>
		<DocProperty name="src" type="string">A URL path to the sprite's image.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/game-object']" />

	<DocSnippet title="Example">
<pre>const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
})

forever(delta =&gt; {
    bunny.rotation += 2
})</pre>
	</DocSnippet>
</template>
