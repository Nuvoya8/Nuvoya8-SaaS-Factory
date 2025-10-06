"use client";

import React, { useState } from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function N8nTestPage() {
    const { loading: globalLoading, user } = useGlobal();
    const [message, setMessage] = useState('Hello from Nuvoya8 Factory!');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTestN8n = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/n8n/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'N8N call failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (globalLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Test N8N Integration
                    </CardTitle>
                    <CardDescription>
                        Testez la communication entre Next.js et N8N
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Info User */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm text-gray-600">
                            <strong>App ID:</strong> {process.env.NEXT_PUBLIC_APP_ID}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>User Email:</strong> {user?.email}
                        </p>
                    </div>

                    {/* Input */}
                    <div className="space-y-2">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                            Message à envoyer à N8N
                        </label>
                        <Input
                            id="message"
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Entrez votre message..."
                            className="w-full"
                        />
                    </div>

                    {/* Button */}
                    <Button
                        onClick={handleTestN8n}
                        disabled={loading || !message}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Appel N8N en cours...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Tester N8N
                            </>
                        )}
                    </Button>

                    {/* Success Result */}
                    {result && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium text-green-800">
                                        ✅ Appel N8N réussi !
                                    </p>
                                    <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                                        {JSON.stringify(result, null, 2)}
                                    </pre>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert className="bg-red-50 border-red-200">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium text-red-800">
                                        ❌ Erreur N8N
                                    </p>
                                    <p className="text-sm text-red-700">{error}</p>
                                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                        <p><strong>Vérifications :</strong></p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>N8N est-il démarré ?</li>
                                            <li>Variable N8N_WEBHOOK_URL définie dans .env ?</li>
                                            <li>Variable N8N_WEBHOOK_SECRET définie dans .env ?</li>
                                            <li>Le workflow "test-workflow" existe-t-il dans N8N ?</li>
                                        </ul>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>📚 Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h3 className="font-medium mb-2">1. Variables d'environnement requises :</h3>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`N8N_WEBHOOK_URL=https://n8n.votredomaine.com/webhook
N8N_WEBHOOK_SECRET=votre-secret-hmac`}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">2. Créer un workflow dans N8N :</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>Nom du workflow : <code className="bg-gray-100 px-1 rounded">test-workflow</code></li>
                            <li>Trigger : Webhook (POST)</li>
                            <li>Vérifier la signature HMAC (X-Signature)</li>
                            <li>Retourner une réponse JSON</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">3. Exemple de réponse N8N attendue :</h3>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`{
  "success": true,
  "data": {
    "message": "Workflow executed successfully",
    "receivedMessage": "Hello from Nuvoya8 Factory!",
    "timestamp": "2025-10-06T12:00:00.000Z"
  }
}`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

