// popup.js
function addConvertButtonListener() {
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        const select1 = document.getElementById('from');
        const select2 = document.getElementById('to');
        convertBtn.addEventListener('click', async () => {
            try {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: () => window.getSelection().toString()
                    }, async (results) => {
                        const selection = results[0].result;
                        if (selection) {
                            convertBtn.disabled = true;
                            const selectedText = selection;
                            const requestBody = {
                                prompt: selectedText,
                                languageTo: select2.value,
                                languageFrom: select1.value !== 'Automatic' ? select1.value : undefined
                            };

                            if (select1.value !== 'Automatic') {
                                requestBody.languageFrom = select1.value;
                            }

                            const apiResponse = await fetch("https://syntha.ai/api/ai-public/converter", {
                                headers: {
                                    "accept": "*/*",
                                },
                                body: JSON.stringify(requestBody),
                                method: "POST",
                                mode: "cors",
                                credentials: "include"
                            });
                            var text = await apiResponse.text();
                            var structuredCode = estructurarCodigo(text);
                            var highlightedCode = highlightSyntax(structuredCode, select2.value);
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                func: (highlightedCode) => {
                                    const selection = window.getSelection();
                                    if (selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        range.deleteContents();
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = highlightedCode;
                                        range.insertNode(tempDiv);
                                    }
                                },
                                args: [highlightedCode]
                            });
                            convertBtn.disabled = false;
                        }
                    });
                });
            } catch (error) {
                console.error('Error:', error);
            }
        });
        return true;
    }
    return false;
}

const intervalId = setInterval(() => {
    if (addConvertButtonListener()) {
        clearInterval(intervalId);
    }
}, 100);

function estructurarCodigo(entrada) {
    const lineasCodigo = entrada.split('\n').filter(linea => linea.startsWith('0:'));
    
    const codigoUnido = lineasCodigo
      .map(linea => {
        let contenido = linea.substring(3).replace(/^"|"$/g, '');
        contenido = contenido.replace(/\\n/g, '\n');
        contenido = contenido.replace(/\\"/g, '"');
        return contenido;
      })
      .join('');

    return codigoUnido;
}

function highlightSyntax(code, language) {
    code = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
             .replace(/'/g, '&apos;').replace(/"/g, '&quot;');

    const commonPatterns = {
        keyword: /\b(if|else|for|while|function|return|var|let|const|class|import|export|from|try|catch|throw|new|this|super|extends|implements|interface|public|private|protected|static|final|abstract|async|await)\b/g,
        string: /&quot;(?:\\.|[^&quot;\\])*&quot;|&apos;(?:\\.|[^&apos;\\])*&apos;|`(?:\\.|[^`\\])*`/g,
        comment: /\/\/.*|\/\*[\s\S]*?\*\//g,
        number: /\b\d+(\.\d+)?(e[+-]?\d+)?\b/gi,
        boolean: /\b(true|false)\b/gi,
        null: /\b(null|undefined)\b/gi,
        function: /\b\w+(?=\s*\()/g,
        class: /\b[A-Z]\w*\b/g,
    };

    const languagePatterns = {
        assembly: {
            keyword: /\b(mov|push|pop|call|ret|jmp|je|jne|jg|jl|add|sub|mul|div|and|or|xor|not|shl|shr)\b/gi,
            register: /\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|ax|bx|cx|dx|si|di|sp|bp|al|bl|cl|dl)\b/gi,
        },
        c: {
            keyword: /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/g,
            preprocessor: /#\w+/g,
        },
        csharp: {
            keyword: /\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while)\b/g,
        },
        cpp: {
            keyword: /\b(asm|auto|bool|break|case|catch|char|class|const|const_cast|continue|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_cast|struct|switch|template|this|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/g,
        },
        clojure: {
            keyword: /\b(def|defn|let|if|do|fn|loop|recur|when|cond|case|doseq|for|seq|vec|map|filter|reduce|atom|deref|swap!|reset!)\b/g,
            special: /\b(nil|true|false)\b/g,
        },
        dart: {
            keyword: /\b(abstract|as|assert|async|await|break|case|catch|class|const|continue|covariant|default|deferred|do|dynamic|else|enum|export|extends|extension|external|factory|false|final|finally|for|Function|get|hide|if|implements|import|in|interface|is|late|library|mixin|new|null|on|operator|part|required|rethrow|return|set|show|static|super|switch|sync|this|throw|true|try|typedef|var|void|while|with|yield)\b/g,
        },
        delphi: {
            keyword: /\b(and|array|as|asm|begin|case|class|const|constructor|destructor|div|do|downto|else|end|except|exports|file|finalization|finally|for|function|goto|if|implementation|in|inherited|initialization|interface|is|label|library|mod|nil|not|object|of|or|packed|procedure|program|property|raise|record|repeat|resourcestring|set|shl|shr|string|then|threadvar|to|try|type|unit|until|uses|var|while|with|xor)\b/gi,
        },
        elixir: {
            keyword: /\b(def|defp|defmodule|defprotocol|defimpl|defmacro|defmacrop|defdelegate|defexception|defstruct|defguard|defguardp|alias|import|require|use|case|cond|if|unless|do|end|fn|raise|catch|rescue|after|else|for|when|quote|unquote)\b/g,
            atom: /:\w+/g,
        },
        fsharp: {
            keyword: /\b(abstract|and|as|assert|base|begin|class|default|delegate|do|done|downcast|downto|elif|else|end|exception|extern|false|finally|for|fun|function|global|if|in|inherit|inline|interface|internal|lazy|let|let!|match|member|module|mutable|namespace|new|not|null|of|open|or|override|private|public|rec|return|return!|select|static|struct|then|to|true|try|type|upcast|use|val|void|when|while|with|yield|yield!)\b/g,
        },
        go: {
            keyword: /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/g,
        },
        groovy: {
            keyword: /\b(as|assert|break|case|catch|class|const|continue|def|default|do|else|enum|extends|finally|for|goto|if|implements|import|in|instanceof|interface|new|package|return|super|switch|this|throw|throws|trait|try|while)\b/g,
        },
        haskell: {
            keyword: /\b(as|case|class|data|default|deriving|do|else|family|forall|foreign|hiding|if|import|in|infix|infixl|infixr|instance|let|module|newtype|of|qualified|then|type|where)\b/g,
        },
        java: {
            keyword: /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/g,
        },
        javascript: {
            keyword: /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|async|await|of)\b/g,
        },
        julia: {
            keyword: /\b(abstract|baremodule|begin|bitstype|break|catch|ccall|const|continue|do|else|elseif|end|export|finally|for|function|global|if|immutable|import|importall|let|local|macro|module|quote|return|try|type|typealias|using|while)\b/g,
        },
        kotlin: {
            keyword: /\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|try|typealias|val|var|vararg|when|where|while)\b/g,
        },
        lua: {
            keyword: /\b(and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g,
        },
        matlab: {
            keyword: /\b(break|case|catch|classdef|continue|else|elseif|end|for|function|global|if|otherwise|parfor|persistent|return|spmd|switch|try|while)\b/g,
        },
        perl: {
            keyword: /\b(if|else|elsif|unless|while|until|for|foreach|last|next|redo|goto|return|die|exit|sub|package|use|require|our|my|local)\b/g,
            variable: /[\$@%]\w+/g,
        },
        php: {
            keyword: /\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/g,
            variable: /\$\w+\b/g,
        },
        python: {
            keyword: /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g,
            decorator: /@\w+/g,
        },
        r: {
            keyword: /\b(if|else|repeat|while|function|for|in|next|break|TRUE|FALSE|NULL|Inf|NaN|NA|NA_integer_|NA_real_|NA_complex_|NA_character_)\b/g,
        },
        ruby: {
            keyword: /\b(alias|and|BEGIN|begin|break|case|class|def|defined|do|else|elsif|END|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield)\b/g,
            symbol: /:\w+/g,
        },
        rust: {
            keyword: /\b(as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn)\b/g,
            lifetime: /'\w+\b/g,
        },
        scala: {
            keyword: /\b(abstract|case|catch|class|def|do|else|extends|false|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|super|this|throw|trait|try|true|type|val|var|while|with|yield)\b/g,
        },
        swift: {
            keyword: /\b(associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|Any|catch|false|is|nil|rethrows|super|self|Self|throw|throws|true|try)\b/g,
        },
        typescript: {
            keyword: /\b(abstract|as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield|module|declare|constructor|namespace|abstract|type|readonly)\b/g,
        },
        sql: {
            keyword: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|GROUP BY|HAVING|ORDER BY|DESC|ASC|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|UNION|ALL|DISTINCT|AS|ON|BETWEEN|LIKE|IN|IS|NULL|NOT|LIMIT|OFFSET)\b/gi,
        },
        mysql: {
            keyword: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|GROUP BY|HAVING|ORDER BY|DESC|ASC|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|UNION|ALL|DISTINCT|AS|ON|BETWEEN|LIKE|IN|IS|NULL|NOT|LIMIT|OFFSET|SHOW|DESCRIBE|EXPLAIN|USE)\b/gi,
        },
        postgresql: {
            keyword: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|GROUP BY|HAVING|ORDER BY|DESC|ASC|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|UNION|ALL|DISTINCT|AS|ON|BETWEEN|LIKE|IN|IS|NULL|NOT|LIMIT|OFFSET|RETURNING|USING|WITH|RECURSIVE|EXPLAIN|ANALYZE)\b/gi,
        },
        oracle: {
            keyword: /\b(SELECT|FROM|WHERE|AND|OR|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|GROUP BY|HAVING|ORDER BY|DESC|ASC|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|UNION|ALL|DISTINCT|AS|ON|BETWEEN|LIKE|IN|IS|NULL|NOT|CONNECT BY|START WITH|PRIOR|NOCYCLE|PIVOT|UNPIVOT|MERGE|USING|MATCHED|WHEN|THEN)\b/gi,
        },
        mongodb: {
            keyword: /\b(db|collection|find|insert|update|remove|aggregate|createIndex|dropIndex|createCollection|dropCollection|count|distinct|mapReduce|group|runCommand)\b/g,
        },
        cassandra: {
            keyword: /\b(SELECT|FROM|WHERE|AND|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|KEYSPACE|INDEX|MATERIALIZED VIEW|USING|WITH|TTL|ALLOW FILTERING|IF NOT EXISTS|IF EXISTS|ORDER BY|LIMIT|CLUSTERING ORDER|PRIMARY KEY|PARTITION KEY)\b/gi,
        },
        redis: {
            keyword: /\b(SET|GET|DEL|EXPIRE|TTL|INCR|DECR|KEYS|FLUSHDB|ZADD|ZRANGE|HSET|HGET|HMSET|HMGET|LPUSH|RPUSH|LPOP|RPOP|LRANGE|SADD|SREM|SMEMBERS|SINTER|SUNION)\b/gi,
        },
        neo4j: {
            keyword: /\b(MATCH|CREATE|MERGE|DELETE|SET|REMOVE|RETURN|WITH|WHERE|AND|OR|XOR|NOT|UNION|UNWIND|CASE|WHEN|THEN|ELSE|END|FOREACH|CALL|YIELD)\b/gi,
        },
        elasticsearch: {
            keyword: /\b(GET|POST|PUT|DELETE|HEAD|index|search|update|bulk|_search|_update|_bulk|query|match|term|range|bool|must|should|must_not|filter|aggs|sort)\b/gi,
        },
        css: {
            selector: /[^\{\}]+(?=\{)/g,
            property: /(\b|\B)[\w-]+(?=\s*:)/g,
            value: /\s*:\s*(.*?)(;|$)/g,
            important: /!important\b/gi,
        },
        bootstrap: {
            class: /\b(container|row|col|btn|form|nav|navbar|card|modal|alert|badge|table|pagination)\b/g,
        },
        tailwindcss: {
            class: /\b(flex|grid|text|bg|border|p|m|w|h|rounded|shadow|hover|focus|active|transition|transform)\b/g,
        },
        materializecss: {
            class: /\b(btn|card|collection|dropdown|modal|sidenav|tabs|waves-effect)\b/g,
        },
        bulma: {
            class: /\b(button|column|container|content|hero|navbar|section|title)\b/g,
        },
        semanticui: {
            class: /\b(ui|button|form|grid|menu|message|modal|segment|table)\b/g,
        },
        react: {
            keyword: /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|React|Component|render|props|state)\b/g,
        },
        angular: {
            keyword: /\b(Component|Directive|Injectable|NgModule|Input|Output|ViewChild|HostListener|Pipe)\b/g,
        },
        vue: {
            keyword: /\b(Vue|component|props|data|methods|computed|watch|mounted|created|destroyed)\b/g,
        },
        svelte: {
            keyword: /\b(let|const|if|else|each|await|then|catch|on:click|bind:value|transition)\b/g,
        },
        express: {
            keyword: /\b(express|app|req|res|next|router|get|post|put|delete|use|listen)\b/g,
        },
        django: {
            keyword: /\b(models|views|urls|forms|admin|settings|manage\.py|makemigrations|migrate|runserver)\b/g,
        },
        rubyonrails: {
            keyword: /\b(ActiveRecord|ActionController|ActionView|ActiveJob|ActiveStorage|ActionMailer|ApplicationRecord|ApplicationController)\b/g,
        },
        laravel: {
            keyword: /\b(Route|Controller|Model|Migration|Seeder|Factory|Middleware|Artisan|Eloquent|Blade)\b/g,
        },
        flask: {
            keyword: /\b(Flask|request|render_template|redirect|url_for|session|flash|abort|jsonify)\b/g,
        },
        aspnetcore: {
            keyword: /\b(IActionResult|Controller|Startup|Program|services|app|UseRouting|UseEndpoints|MapControllers)\b/g,
        },
        springboot: {
            keyword: /\b(SpringBootApplication|RestController|Autowired|RequestMapping|GetMapping|PostMapping|Service|Repository)\b/g,
        },
        fastapi: {
            keyword: /\b(FastAPI|APIRouter|Depends|HTTPException|Request|Response|Path|Query|Body)\b/g,
        },
        nestjs: {
            keyword: /\b(Module|Controller|Injectable|Get|Post|Put|Delete|Param|Body|Query)\b/g,
        },
        gin: {
            keyword: /\b(gin|Context|Engine|RouterGroup|HandlerFunc|Default|New|GET|POST|PUT|DELETE)\b/g,
        },
        pytorch: {
            keyword: /\b(torch|nn|optim|cuda|Tensor|Module|Parameter|backward|zero_grad|step)\b/g,
        },
        tensorflow: {
            keyword: /\b(tf|keras|layers|models|Sequential|Dense|Conv2D|MaxPooling2D|Flatten|compile|fit|predict)\b/g,
        },
        keras: {
            keyword: /\b(Sequential|Dense|Conv2D|MaxPooling2D|Flatten|compile|fit|predict|evaluate)\b/g,
        },
        scikitlearn: {
            keyword: /\b(sklearn|train_test_split|fit|predict|accuracy_score|classification_report|confusion_matrix)\b/g,
        },
        theano: {
            keyword: /\b(theano|tensor|function|grad|scan|shared)\b/g,
        },
    };

    // Combinar patrones comunes con los específicos del lenguaje
    const combinedPatterns = { ...commonPatterns, ...(languagePatterns[language] || {}) };

    // Aplicar colores sin añadir comillas extras
    let coloredCode = code;
    for (const [type, regex] of Object.entries(combinedPatterns)) {
        coloredCode = coloredCode.replace(regex, match => `<span class="highlight-${type}">${match}</span>`);
    }

    return coloredCode;
}

