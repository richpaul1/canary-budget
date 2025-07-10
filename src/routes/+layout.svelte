<script>
    import Header from './Header.svelte';
    import '../app.css';

    let { children } = $props();
</script>

<div class="app">
    <Header />

    <main>
        {@render children()}
    </main>

    <footer>
        
    </footer>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        width: 100%; /* Ensure the app container takes full width */
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        max-width: 100%; /* Remove max-width constraint for full width */
        margin: 0; /* Explicitly remove any margin */
        box-sizing: border-box;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }
</style>