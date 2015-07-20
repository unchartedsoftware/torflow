import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

/**
 * Created by cdickson on 15-07-17.
 */
public class StitchTorCSV {

    private static String DATE_COLUMN_NAME = "Date";
    private static DateTimeZone timeZone = DateTimeZone.forID("Zulu");
    private static DateTimeFormatter dateTimeFormatter = DateTimeFormat.forPattern("dd/MM/yyyy HH:mm:ss").withZone(timeZone);

    public static String getISOTimeFromFilename(String filename) {
        String filenamePrefix = filename.replace(".csv", "");
        String[] filenamePieces = filenamePrefix.split("-");
        String year = filenamePieces[1];
        String month = filenamePieces[2];
        String day = filenamePieces[3];
        String hour = filenamePieces[4];
        String minute = filenamePieces[5];
        String second = filenamePieces[6];
        String dtString = day + "/" + month + "/" + year + " " + hour + ":" + minute + ":" + second;
        DateTime dateTime = dateTimeFormatter.parseDateTime(dtString);
        return dateTime.toString();
    }

    public static void displayUsage() {
        System.out.println("Usage:");
        System.out.println("\tTorCSVProcessor inPath outPath");
        System.out.println("\t\tinPath:  The directory containing the original Tor csv output files.");
        System.out.println("\t\toutPath:  The directory where the processed files will be written.");
    }

    public static void processFile(File inputCSV, String outPath) {
        String isoDate = getISOTimeFromFilename(inputCSV.getName());

        BufferedReader br = null;
        BufferedWriter bw = null;
        String line;
        boolean isFirstLine = true;

        try {

            br = new BufferedReader(new FileReader(inputCSV));
            bw = new BufferedWriter(new FileWriter(outPath + "/" + inputCSV.getName()));
            while ((line = br.readLine()) != null) {
                line = line.replaceAll("\n","");
                if (isFirstLine) {
                    String appendedHeader = line + "," + DATE_COLUMN_NAME + "\n";
                    bw.write(appendedHeader);
                    isFirstLine = false;
                } else {
                    String appendedLine = line + "," + isoDate + "\n";
                    bw.write(appendedLine);
                }

            }

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (bw != null) {
                try {
                    bw.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

    }


    public static void main(String[] args) {
        if (args.length != 2) {
            displayUsage();
            return;
        }

        String inPath = args[0];
        String outPath = args[1];

        File dir = new File(inPath);
        File[] directoryListing = dir.listFiles();

        // Create output directory
        new File(outPath).mkdirs();

        List<File> csvFiles = new ArrayList<File>();
        for (File child : directoryListing) {
            if (child.getName().endsWith(".csv")) {
                csvFiles.add(child);
            }
        }

        System.out.println("Processing csv files...");
        for(File f : csvFiles) {
            System.out.println("\t" + f.getName());
            processFile(f,outPath);
        }
    }
}
