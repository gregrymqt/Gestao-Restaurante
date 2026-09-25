# Matriz de Banimento e Substituição Obrigatória de Pacotes (Expo SDK 54+)

Esta matriz estabelece os pacotes que estão **terminantemente banidos** da base de código do Restaurante Inteligente e seus respectivos substitutos mandatórios alinhados com o Expo SDK 54+ e a Nova Arquitetura do React Native.

| Pacote / Padrão Banido | Justificativa Técnica para o Banimento | Pacote ou Padrão Mandatório de Substituição |
| :--- | :--- | :--- |
| **`expo-av`** | Obsoleto no ecossistema moderno; instabilidade de performance e falta de alinhamento com a Nova Arquitetura (TurboModules). | **`expo-audio`** e **`expo-video`** (introduzidos e otimizados a partir do Expo SDK 53/54). |
| **`expo-permissions`** | Centralização descontinuada; viola os princípios modernos de privacidade granular do iOS e Android. | Métodos granulares nativos embutidos em cada pacote funcional (ex.: `requestCameraPermissionsAsync()`). |
| **`@react-native-async-storage/async-storage`** | Overhead acentuado na serialização via ponte JavaScript; latência desnecessária em acessos síncronos de inicialização (causa *async waterfalls*). | **`react-native-mmkv`** para armazenamento síncrono ultra-rápido de alta vazão ou **`expo-sqlite`**. |
| **`@expo/vector-icons`** | Impacto volumoso no bundle da aplicação e falta de renderização vetorial nativa avançada no iOS/Android modernos. | **`expo-symbols`** para integração nativa com SF Symbols no iOS e glifos vetorizados no Android. |
| **`ScrollView` para Listas Dinâmicas** | Não realiza reciclagem e virtualização de nós no DOM nativo; induz falhas críticas de falta de memória (OOM) sob grandes volumes. | **`@shopify/flash-list`** com reciclagem rápida de células ou `FlatList` com parametrização de buffer estrita. |
| **`Animated.timing` sem Limpeza** | Execução no thread de JS suscetível a bloqueios e fugas de memória (*memory leaks*) ao desmontar componentes. | **`react-native-reanimated`** (execução descentralizada via worklets na UI thread) e `react-native-worklets`. |
| **Tags HTML (`<div>`, `<span>`, `<p>`)** | Namespace de elementos Web incompatível com o sistema nativo de composição de views móveis. | Primitivas nativas formais: **`<View>`**, **`<Text>`**, **`<Pressable>`** com tipagem estrita de props. |
| **`display: grid` em Estilos** | Propriedade CSS Web inexistente no Yoga Layout engine do React Native. | Layout baseado exclusivamente em **Flexbox** nativo (`flexDirection`, `gap`, `justifyContent`, `alignItems`). |
| **Estilos Inline Dinâmicos** | `style={{ ... }}` em loops cria novos objetos em cada render, causando pressão no Garbage Collector. | **`StyleSheet.create`** ou design tokens pré-computados. |
