import React, { useState } from 'react';
import { Calculator, Info, HelpCircle } from 'lucide-react';

function App() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [simplified, setSimplified] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const isVariable = (term: string) => /^[ABC]$/.test(term);

  const tokenize = (expr: string) => {
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (char === ' ') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }
      
      if (char === '(' || char === ')') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else if (char === '&' || char === '|') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else if (char === '~') {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }
    
    if (current) {
      tokens.push(current);
    }
    
    return tokens;
  };

  const evaluateSimpleExpression = (expr: string): boolean | null => {
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    return null;
  };

  // Helper function to simplify basic patterns
  const simplifyBasicPatterns = (expr: string): string => {
    let simplified = expr;
    
    // Basic simplification rules
    const rules = [
      // Identity
      { pattern: /\(([ABC])\s*&\s*\1\)/g, replacement: '$1' },
      { pattern: /\(([ABC])\s*\|\s*\1\)/g, replacement: '$1' },
      { pattern: /([ABC])\s*&\s*\1/g, replacement: '$1' },
      { pattern: /([ABC])\s*\|\s*\1/g, replacement: '$1' },
      
      // Double negation
      { pattern: /~\s*~\s*([ABC])/g, replacement: '$1' },
      
      // Complement
      { pattern: /\(([ABC])\s*&\s*~\1\)/g, replacement: 'False' },
      { pattern: /\(~([ABC])\s*&\s*\1\)/g, replacement: 'False' },
      { pattern: /([ABC])\s*&\s*~\1/g, replacement: 'False' },
      { pattern: /~([ABC])\s*&\s*\1/g, replacement: 'False' },
      
      // OR with complement
      { pattern: /\(([ABC])\s*\|\s*~\1\)/g, replacement: 'True' },
      { pattern: /\(~([ABC])\s*\|\s*\1\)/g, replacement: 'True' },
      { pattern: /([ABC])\s*\|\s*~\1/g, replacement: 'True' },
      { pattern: /~([ABC])\s*\|\s*\1/g, replacement: 'True' },
      
      // Absorption
      { pattern: /([ABC])\s*&\s*\(\1\s*\|\s*[ABC]\)/g, replacement: '$1' },
      { pattern: /([ABC])\s*&\s*\([ABC]\s*\|\s*\1\)/g, replacement: '$1' },
      { pattern: /\(\1\s*\|\s*[ABC]\)\s*&\s*([ABC])/g, replacement: '$1' },
      { pattern: /\([ABC]\s*\|\s*\1\)\s*&\s*([ABC])/g, replacement: '$1' },
      
      // Distribution
      { pattern: /\(([ABC])\s*&\s*([ABC])\)\s*\|\s*\(\1\s*&\s*([ABC])\)/g, replacement: '$1 & ($2 | $3)' },
      { pattern: /\(([ABC])\s*&\s*([ABC])\)\s*\|\s*\(([ABC])\s*&\s*\1\)/g, replacement: '$1 & ($2 | $3)' },
      
      // AND with True/False
      { pattern: /True\s*&\s*([ABC])/g, replacement: '$1' },
      { pattern: /([ABC])\s*&\s*True/g, replacement: '$1' },
      { pattern: /False\s*&\s*[ABC]/g, replacement: 'False' },
      { pattern: /[ABC]\s*&\s*False/g, replacement: 'False' },
      
      // OR with True/False
      { pattern: /True\s*\|\s*[ABC]/g, replacement: 'True' },
      { pattern: /[ABC]\s*\|\s*True/g, replacement: 'True' },
      { pattern: /False\s*\|\s*([ABC])/g, replacement: '$1' },
      { pattern: /([ABC])\s*\|\s*False/g, replacement: '$1' },
      
      // Clean up extra parentheses
      { pattern: /\(\(([^()]+)\)\)/g, replacement: '($1)' },
      { pattern: /\(\s*([ABC])\s*\)/g, replacement: '$1' },
    ];
    
    let prevSimplified;
    do {
      prevSimplified = simplified;
      for (const rule of rules) {
        simplified = simplified.replace(rule.pattern, rule.replacement);
      }
    } while (prevSimplified !== simplified);
    
    return simplified;
  };

  const simplifyComplexExpression = (tokens: string[]): string => {
    let expr = tokens.join(' ');
    let hasParentheses = true;
    
    while (hasParentheses) {
      hasParentheses = false;
      expr = expr.replace(/\(([^()]+)\)/g, (match, group) => {
        hasParentheses = true;
        return simplifyBasicPatterns(group);
      });
    }
    
    return simplifyBasicPatterns(expr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tokens = tokenize(expression);
      const simplifiedExpr = simplifyComplexExpression(tokens);
      
      setResult(`Original: ${expression}`);
      setSimplified(simplifiedExpr);
    } catch (error) {
      setResult('Error al evaluar la expresión');
      setSimplified('Expresión no valida');
    }
  };

  const insertOperator = (op: string) => {
    setExpression(prev => {

      if (op === '&' || op === '|') {
        return prev + ` ${op} `;
      }

      if (op === '~') {
        return prev + op;
      }

      if (op === '(' || op === ')') {
        return prev + (op === ')' && prev.length > 0 ? ' ' + op : op);
      }

      if (prev.endsWith('~') || prev.endsWith('(')) {
        return prev + op;
      }
      return prev + (prev.length > 0 ? ' ' + op : op);
    });
  };

  const clearExpression = () => {
    setExpression('');
    setResult('');
    setSimplified('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              <h1 className="text-xl font-bold">Calculadora Booleana</h1>
            </div>
            <button
              className="text-gray-300 hover:text-white"
              onClick={() => setShowHelp(!showHelp)}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          {showHelp && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg text-sm">
              <h2 className="font-bold mb-2 text-blue-400">¿Cómo se usa?</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1 text-gray-300">Variables:</h3>
                  <ul className="space-y-1 text-gray-400">
                    <li><span className="font-mono bg-gray-700 px-1 rounded">A</span> - Variable booleana A</li>
                    <li><span className="font-mono bg-gray-700 px-1 rounded">B</span> - Variable booleana B</li>
                    <li><span className="font-mono bg-gray-700 px-1 rounded">C</span> - Variable booleana C</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-300">Operadores:</h3>
                  <ul className="space-y-1 text-gray-400">
                    <li><span className="font-mono bg-gray-700 px-1 rounded">&</span> - AND (Y lógico)</li>
                    <li><span className="font-mono bg-gray-700 px-1 rounded">|</span> - OR (O lógico)</li>
                    <li><span className="font-mono bg-gray-700 px-1 rounded">~</span> - NOT (Negación)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold mb-1 text-gray-300">Ejemplo:</h3>
                <p className="text-gray-400">
                  <span className="font-mono bg-gray-700 px-1 rounded">(A & B) | (A & ~C)</span>
                  <br />
                  Significa: (A AND B) OR (A AND C (negada))
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                placeholder="Ingresa tu expresión booleana..."
              />
              <button
                type="button"
                onClick={clearExpression}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['(', ')', '&', '|', '~', 'A', 'B', 'C'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertOperator(op)}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors"
                >
                  {op}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Evaluar
            </button>
          </form>
        </div>
        
        <div className="p-6 space-y-3">
          {result && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300">Expresión ingresada:</p>
              <p className="font-mono">{result}</p>
            </div>
          )}
          {simplified && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-300">Resultado simplificado:</p>
              <p className="font-mono">{simplified}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;