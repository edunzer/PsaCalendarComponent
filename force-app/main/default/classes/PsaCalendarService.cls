public with sharing class PsaCalendarService {
    @AuraEnabled
    public static List<pse__Assignment__c> fetchAllAssignments() {
        try {
            System.debug('Fetching assignments from pse__Assignment__c');
            List<pse__Assignment__c> assignments = [
                SELECT Id, Name, pse__Start_Date__c, pse__End_date__c
                FROM pse__Assignment__c
                LIMIT 100
            ];
            System.debug('Assignments fetched: ' + assignments);
            return assignments;
        } catch (Exception e) {
            System.debug('Error while fetching assignments: ' + e.getMessage());
            throw new AuraHandledException('Unable to fetch assignments. Please contact admin.');
        }
    }
}
