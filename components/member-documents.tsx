"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, Download, Trash2, Eye, Plus, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { MemberDocument } from "@/lib/types"

interface MemberDocumentsProps {
  documents?: MemberDocument[]
  onAddDocument?: (document: MemberDocument) => void
  onDeleteDocument?: (documentId: string) => void
}

export function MemberDocuments({ documents = [], onAddDocument, onDeleteDocument }: MemberDocumentsProps) {
  const { locale } = useLanguage()
  const t = getTranslation(locale)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState<Partial<MemberDocument>>({
    type: "Other",
    fileName: "",
    notes: "",
  })

  const handleAddDocument = () => {
    if (onAddDocument && newDocument.fileName && newDocument.type) {
      onAddDocument({
        id: `doc-${Date.now()}`,
        type: newDocument.type,
        fileName: newDocument.fileName,
        fileUrl: `/uploads/${newDocument.fileName}`, // Mock URL
        uploadedDate: new Date().toISOString(),
        notes: newDocument.notes,
      } as MemberDocument)
      
      setNewDocument({ type: "Other", fileName: "", notes: "" })
      setIsDialogOpen(false)
    }
  }

  const getDocumentIcon = (type: string) => {
    return <FileText className="w-5 h-5" />
  }

  const documentTypes = [
    { value: "Member Acceptance File", label: t.documents.memberAcceptanceFile },
    { value: "Sinbet File", label: t.documents.sinbetFile },
    { value: "Marriage Certificate", label: t.documents.marriageCertificate },
    { value: "Baptism Certificate", label: t.documents.baptismCertificate },
    { value: "ID Card Copy", label: t.documents.idCardCopy },
    { value: "Other", label: t.documents.other },
  ]

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t.documents.title}
            </CardTitle>
            <CardDescription>
              {locale === "en" 
                ? "Manage member documents and certificates" 
                : "የአባል ሰነዶችን እና የምስክር ወረቀቶችን ያስተዳድሩ"}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t.documents.uploadDocument}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t.documents.uploadDocument}</DialogTitle>
                <DialogDescription>
                  {locale === "en" 
                    ? "Upload a new document for this member" 
                    : "ለዚህ አባል አዲስ ሰነድ ይስቀሉ"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="docType">{locale === "en" ? "Document Type" : "የሰነድ አይነት"}</Label>
                  <Select 
                    value={newDocument.type} 
                    onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="docFile">{locale === "en" ? "File" : "ፋይል"}</Label>
                  <Input 
                    id="docFile" 
                    type="file" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    className="mt-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setNewDocument(prev => ({ ...prev, fileName: file.name }))
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {locale === "en" 
                      ? "Supported formats: PDF, Word, JPG, PNG (Max 5MB)" 
                      : "የሚደገፉ ቅርጸቶች፡ PDF፣ Word፣ JPG፣ PNG (ከፍተኛው 5MB)"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="docNotes">{locale === "en" ? "Notes" : "ማስታወሻዎች"}</Label>
                  <Textarea
                    id="docNotes"
                    value={newDocument.notes}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    placeholder={locale === "en" ? "Optional notes about this document" : "ስለዚህ ሰነድ አማራጭ ማስታወሻዎች"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button onClick={handleAddDocument} disabled={!newDocument.fileName}>
                  <Upload className="w-4 h-4 mr-2" />
                  {locale === "en" ? "Upload" : "ስቀል"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{locale === "en" ? "No documents uploaded yet" : "ገና ምንም ሰነዶች አልተስቀሉም"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getDocumentIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteDocument?.(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

