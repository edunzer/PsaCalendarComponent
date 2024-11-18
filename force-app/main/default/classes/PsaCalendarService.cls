public with sharing class PsaCalendarService {
    @AuraEnabled(cacheable=true)
    public static List<pse__Assignment__c> fetchAllAssignments(String projectName) {
        try {
            // Use the provided projectName or a default value if null
            String projectFilter = String.isBlank(projectName) ? 'Global Time Off Project' : projectName;
            
            List<pse__Assignment__c> assignments = [
                SELECT Id, Name, pse__Start_Date__c, pse__End_Date__c, 
                       pse__Resource__r.Name, pse__Project__r.Name
                FROM pse__Assignment__c
                WHERE pse__Start_Date__c != null 
                  AND pse__End_Date__c != null 
                  AND pse__Project__r.Name = :projectFilter
                LIMIT 1000
            ];
            return assignments;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch assignments. Please contact admin.');
        }
    }
}
