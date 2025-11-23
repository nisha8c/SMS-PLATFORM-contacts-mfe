import { useState } from 'react';
import { Plus, Search, Filter, Download, Upload, Trash2 } from 'lucide-react';
import { Button } from 'shared-lib';
import { Input } from 'shared-lib';
import { Card } from 'shared-lib';
import { Badge } from 'shared-lib';
import { mockContacts } from 'shared-lib';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from 'shared-lib';
import { Checkbox } from 'shared-lib';
import { Label } from 'shared-lib';
import { useToast } from 'shared-lib';
import { ConfirmDialog } from 'shared-lib';
import type { Contact } from 'shared-lib';
import { useTranslation } from 'react-i18next';

export default function ContactsPage() {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState(mockContacts);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', tags: '' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    // Get unique tags from all contacts
    const allTags = Array.from(new Set(mockContacts.flatMap(c => c.tags)));

    // Filter contacts
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = searchQuery === '' ||
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatuses.length === 0 ||
            selectedStatuses.includes(contact.consentStatus);

        const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => contact.tags.includes(tag));

        return matchesSearch && matchesStatus && matchesTags;
    });

    const handleExport = () => {
        const csv = [
            ['Name', 'Phone', 'Email', 'Tags', 'Status'].join(','),
            ...filteredContacts.map(c =>
                [c.name, c.phone || '', c.email || '', c.tags.join(';'), c.consentStatus].join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: 'Export successful',
            description: `Exported ${filteredContacts.length} contacts`,
        });
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').slice(1); // Skip header
            const imported = lines
                .filter(line => line.trim())
                .map((line, index) => {
                    const [name, phone, email, tags, status] = line.split(',');
                    return {
                        id: `imported-${Date.now()}-${index}`,
                        companyId: 'default',
                        name: name?.trim() || 'Unknown',
                        phone: phone?.trim(),
                        email: email?.trim(),
                        tags: tags?.split(';').filter(Boolean) || [],
                        consentStatus: (status?.trim() as any) || 'pending',
                        optOutChannels: [],
                    };
                });

            setContacts([...contacts, ...imported]);
            toast({
                title: 'Import successful',
                description: `Imported ${imported.length} contacts`,
            });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
        setSelectedTags([]);
    };

    const handleAddContact = () => {
        if (!newContact.name.trim()) {
            toast({
                title: t('common.error'),
                description: t('contacts.contactAdded'),
                variant: 'destructive',
            });
            return;
        }

        const contact: Contact = {
            id: `contact-${Date.now()}`,
            companyId: 'default',
            name: newContact.name,
            email: newContact.email || undefined,
            phone: newContact.phone || undefined,
            tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean),
            consentStatus: 'pending',
            optOutChannels: [],
        };

        setContacts([...contacts, contact]);
        setNewContact({ name: '', email: '', phone: '', tags: '' });
        setAddDialogOpen(false);

        toast({
            title: t('common.success'),
            description: t('contacts.contactAdded'),
        });
    };

    const handleEditContact = () => {
        if (!selectedContact) return;

        toast({
            title: 'Success',
            description: `${selectedContact.name} has been updated`,
        });
        setEditDialogOpen(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredContacts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredContacts.map(c => c.id));
        }
    };

    const toggleSelectId = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const confirmDelete = () => {
        setContacts(contacts.filter(c => !selectedIds.includes(c.id)));
        toast({
            title: t('common.deleted'),
            description: t('contacts.contactsDeleted', { count: selectedIds.length }),
        });
        setSelectedIds([]);
        setDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('contacts.title')}</h1>
                    <p className="text-muted-foreground">{t('contacts.subtitle')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="hover:glow-primary" asChild>
                        <label className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            {t('contacts.import')}
                            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                        </label>
                    </Button>
                    <Button variant="outline" className="hover:glow-primary" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('contacts.export')}
                    </Button>
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:glow-primary">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('contacts.addContact')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-glass-border">
                            <DialogHeader>
                                <DialogTitle>{t('contacts.addNewContact')}</DialogTitle>
                                <DialogDescription>{t('contacts.createContact')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('contacts.name')} *</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('contacts.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('contacts.phone')}</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1 234 567 8900"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tags">{t('contacts.tagsComma')}</Label>
                                    <Input
                                        id="tags"
                                        placeholder="VIP, Marketing"
                                        value={newContact.tags}
                                        onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button onClick={handleAddContact}>
                                        {t('contacts.addContact')}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contacts by name, phone, or email..."
                        className="pl-10 glass-card border-glass-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="hover:glow-primary">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {(selectedStatuses.length > 0 || selectedTags.length > 0) && (
                                <Badge className="ml-2 bg-primary/20 text-primary">
                                    {selectedStatuses.length + selectedTags.length}
                                </Badge>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-glass-border">
                        <DialogHeader>
                            <DialogTitle>Filter Contacts</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-3">Consent Status</h3>
                                <div className="space-y-2">
                                    {['granted', 'pending', 'denied'].map((status) => (
                                        <div key={status} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={status}
                                                checked={selectedStatuses.includes(status)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedStatuses(
                                                        checked
                                                            ? [...selectedStatuses, status]
                                                            : selectedStatuses.filter((s) => s !== status)
                                                    );
                                                }}
                                            />
                                            <Label htmlFor={status} className="capitalize cursor-pointer">
                                                {status}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium mb-3">Tags</h3>
                                <div className="space-y-2">
                                    {allTags.map((tag) => (
                                        <div key={tag} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={tag}
                                                checked={selectedTags.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedTags(
                                                        checked
                                                            ? [...selectedTags, tag]
                                                            : selectedTags.filter((t) => t !== tag)
                                                    );
                                                }}
                                            />
                                            <Label htmlFor={tag} className="cursor-pointer">
                                                {tag}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                Clear Filters
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 p-4 glass-card border-glass-border rounded-lg">
          <span className="text-sm text-foreground font-medium">
            {selectedIds.length} selected
          </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIds([])}
                    >
                        Clear Selection
                    </Button>
                </div>
            )}

            <Card className="glass-card border-glass-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap w-12">
                                <Checkbox
                                    checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Name
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Phone
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Email
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Tags
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Status
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredContacts.map((contact) => (
                            <tr
                                key={contact.id}
                                className="border-t border-glass-border hover:bg-muted/50 transition-colors"
                            >
                                <td className="p-4">
                                    <Checkbox
                                        checked={selectedIds.includes(contact.id)}
                                        onCheckedChange={() => toggleSelectId(contact.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {contact.name.charAt(0)}
                        </span>
                                        </div>
                                        <span className="font-medium text-foreground">{contact.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">{contact.phone}</td>
                                <td className="p-4 text-sm text-muted-foreground">{contact.email}</td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        {contact.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="bg-primary/20 text-primary"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge
                                        variant={contact.consentStatus === 'granted' ? 'default' : 'secondary'}
                                        className={
                                            contact.consentStatus === 'granted'
                                                ? 'bg-primary/20 text-primary'
                                                : ''
                                        }
                                    >
                                        {contact.consentStatus}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedContact(contact);
                                            setEditDialogOpen(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Contact Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="glass-card border-glass-border">
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>Update contact information</DialogDescription>
                    </DialogHeader>
                    {selectedContact && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editName">Name</Label>
                                <Input
                                    id="editName"
                                    defaultValue={selectedContact.name}
                                    className="glass-card border-glass-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editEmail">Email</Label>
                                <Input
                                    id="editEmail"
                                    type="email"
                                    defaultValue={selectedContact.email}
                                    className="glass-card border-glass-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editPhone">Phone</Label>
                                <Input
                                    id="editPhone"
                                    defaultValue={selectedContact.phone}
                                    className="glass-card border-glass-border"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleEditContact}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={t('configuration.deleteConfirm')}
                description={t('contacts.deleteConfirm', { count: selectedIds.length })}
                onConfirm={confirmDelete}
                confirmText={t('common.delete')}
            />
        </div>
    );
}
