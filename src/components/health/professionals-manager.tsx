'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Plus, Search, Phone, Mail, MapPin, Globe, Instagram } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import type { HealthProfessional, HealthEstablishment, ProfessionalType } from '@/lib/types-health';
import { professionalTypes, establishmentTypes } from '@/lib/types-health';

interface ProfessionalsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfessionalsManager({ isOpen, onClose }: ProfessionalsManagerProps) {
  const [activeTab, setActiveTab] = useState<'professionals' | 'establishments'>('professionals');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProfessionalOpen, setIsAddProfessionalOpen] = useState(false);
  const [isAddEstablishmentOpen, setIsAddEstablishmentOpen] = useState(false);
  
  const firestore = useFirestore();
  const { user } = useUser();

  // Form states for professionals
  const [professionalForm, setProfessionalForm] = useState({
    name: '',
    profession: 'doctor' as ProfessionalType,
    specialty: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    instagram: '',
    notes: '',
  });

  // Form states for establishments
  const [establishmentForm, setEstablishmentForm] = useState({
    name: '',
    type: 'clinic' as keyof typeof establishmentTypes,
    phone: '',
    email: '',
    address: '',
    website: '',
    openingHours: '',
    specialties: [] as string[],
    notes: '',
  });

  // Fetch professionals and establishments
  const professionalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/healthProfessionals`),
      orderBy('name')
    );
  }, [user, firestore]);

  const establishmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/healthEstablishments`),
      orderBy('name')
    );
  }, [user, firestore]);

  const { data: professionals = [] } = useCollection<HealthProfessional>(professionalsQuery);
  const { data: establishments = [] } = useCollection<HealthEstablishment>(establishmentsQuery);

  const filteredProfessionals = (professionals || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEstablishments = (establishments || []).filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProfessional = async () => {
    if (!user) return;

    try {
      await addDoc(collection(firestore, `users/${user.uid}/healthProfessionals`), {
        ...professionalForm,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setProfessionalForm({
        name: '',
        profession: 'doctor',
        specialty: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        instagram: '',
        notes: '',
      });
      setIsAddProfessionalOpen(false);
    } catch (error) {
      console.error('Error adding professional:', error);
    }
  };

  const handleAddEstablishment = async () => {
    if (!user) return;

    try {
      await addDoc(collection(firestore, `users/${user.uid}/healthEstablishments`), {
        ...establishmentForm,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setEstablishmentForm({
        name: '',
        type: 'clinic',
        phone: '',
        email: '',
        address: '',
        website: '',
        openingHours: '',
        specialties: [],
        notes: '',
      });
      setIsAddEstablishmentOpen(false);
    } catch (error) {
      console.error('Error adding establishment:', error);
    }
  };

  const toggleFavorite = async (item: HealthProfessional | HealthEstablishment, type: 'professional' | 'establishment') => {
    if (!user) return;

    const collectionPath = type === 'professional' 
      ? `users/${user.uid}/healthProfessionals`
      : `users/${user.uid}/healthEstablishments`;

    try {
      await updateDoc(doc(firestore, collectionPath, item.id), {
        isFavorite: !item.isFavorite,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const deleteItem = async (id: string, type: 'professional' | 'establishment') => {
    if (!user) return;

    const collectionPath = type === 'professional' 
      ? `users/${user.uid}/healthProfessionals`
      : `users/${user.uid}/healthEstablishments`;

    try {
      await deleteDoc(doc(firestore, collectionPath, id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Profissionais & Estabelecimentos de Saúde</SheetTitle>
          <SheetDescription>
            Cadastre e gerencie seus profissionais e estabelecimentos favoritos de saúde
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="establishments">Estabelecimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="professionals" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profissionais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsAddProfessionalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="grid gap-4 max-h-[400px] overflow-y-auto">
              {filteredProfessionals.map((professional) => (
                <Card key={professional.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{professional.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{professionalTypes[professional.profession as ProfessionalType]}</Badge>
                          {professional.specialty && <Badge variant="outline">{professional.specialty}</Badge>}
                          {professional.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(professional, 'professional')}
                        >
                          <Star className={`h-4 w-4 ${professional.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(professional.id, 'professional')}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      {professional.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {professional.phone}
                        </div>
                      )}
                      {professional.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {professional.email}
                        </div>
                      )}
                      {professional.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {professional.address}
                        </div>
                      )}
                      {professional.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a href={professional.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {professional.website}
                          </a>
                        </div>
                      )}
                      {professional.instagram && (
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-muted-foreground" />
                          @{professional.instagram}
                        </div>
                      )}
                      {professional.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {professional.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="establishments" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estabelecimentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsAddEstablishmentOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="grid gap-4 max-h-[400px] overflow-y-auto">
              {filteredEstablishments.map((establishment) => (
                <Card key={establishment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{establishment.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{establishmentTypes[establishment.type]}</Badge>
                          {establishment.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(establishment, 'establishment')}
                        >
                          <Star className={`h-4 w-4 ${establishment.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(establishment.id, 'establishment')}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      {establishment.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {establishment.phone}
                        </div>
                      )}
                      {establishment.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {establishment.address}
                        </div>
                      )}
                      {establishment.openingHours && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Horário:</strong> {establishment.openingHours}
                        </div>
                      )}
                      {establishment.specialties && establishment.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {establishment.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {establishment.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          {establishment.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Professional Sheet */}
        <Sheet open={isAddProfessionalOpen} onOpenChange={setIsAddProfessionalOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Adicionar Profissional</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={professionalForm.name}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. João Silva"
                />
              </div>
              <div>
                <Label htmlFor="profession">Profissão</Label>
                <Select value={professionalForm.profession} onValueChange={(value) => setProfessionalForm(prev => ({ ...prev, profession: value as ProfessionalType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(professionalTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  value={professionalForm.specialty}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Cardiologia, Pediatria, etc."
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={professionalForm.phone}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={professionalForm.email}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={professionalForm.address}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua das Flores, 123 - São Paulo/SP"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={professionalForm.website}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={professionalForm.instagram}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@drjoaosilva"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={professionalForm.notes}
                  onChange={(e) => setProfessionalForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais..."
                />
              </div>
              <Button onClick={handleAddProfessional} className="w-full">
                Salvar Profissional
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Add Establishment Sheet */}
        <Sheet open={isAddEstablishmentOpen} onOpenChange={setIsAddEstablishmentOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Adicionar Estabelecimento</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="establishment-name">Nome</Label>
                <Input
                  id="establishment-name"
                  value={establishmentForm.name}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Hospital São Lucas"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={establishmentForm.type} onValueChange={(value) => setEstablishmentForm(prev => ({ ...prev, type: value as keyof typeof establishmentTypes }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(establishmentTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="establishment-phone">Telefone</Label>
                <Input
                  id="establishment-phone"
                  value={establishmentForm.phone}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="establishment-address">Endereço</Label>
                <Input
                  id="establishment-address"
                  value={establishmentForm.address}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua das Flores, 123 - São Paulo/SP"
                />
              </div>
              <div>
                <Label htmlFor="opening-hours">Horário de Funcionamento</Label>
                <Input
                  id="opening-hours"
                  value={establishmentForm.openingHours}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, openingHours: e.target.value }))}
                  placeholder="Seg-Sex: 8h-18h, Sáb: 8h-12h"
                />
              </div>
              <div>
                <Label htmlFor="establishment-website">Website</Label>
                <Input
                  id="establishment-website"
                  value={establishmentForm.website}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="establishment-notes">Observações</Label>
                <Textarea
                  id="establishment-notes"
                  value={establishmentForm.notes}
                  onChange={(e) => setEstablishmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais..."
                />
              </div>
              <Button onClick={handleAddEstablishment} className="w-full">
                Salvar Estabelecimento
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </SheetContent>
    </Sheet>
  );
}
